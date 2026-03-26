from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import uuid
import re

from database import get_db, User, Lab, TerminalSession
from routers.auth import get_current_user

router = APIRouter()


class CommandRequest(BaseModel):
    session_id: str
    command: str
    lab_slug: str


# Virtual filesystem and state per lab
LAB_ENVIRONMENTS = {
    "sql-injection-basics": {
        "files": {
            "/": ["home", "var", "etc", "flag.txt"],
            "/home": ["user"],
            "/var": ["www"],
            "/var/www": ["html"],
            "/var/www/html": ["index.php", "login.php", "db.php"],
        },
        "db_tables": {
            "users": [
                {"id": 1, "username": "admin", "password": "s3cr3t_p4ss", "email": "admin@lab.local"},
                {"id": 2, "username": "user1", "password": "password123", "email": "user1@lab.local"},
            ],
            "secrets": [
                {"id": 1, "name": "flag", "value": "FLAG{sql_1nj3ct10n_byp4ss_1337}"},
            ],
            "admin_logs": [{"id": 1, "action": "login", "timestamp": "2024-01-01"}],
        },
        "vulnerable_app": True,
        "flag": "FLAG{sql_1nj3ct10n_byp4ss_1337}",
    },
    "sql-injection-union": {
        "files": {"/": ["home", "var"], "/var/www": ["products.php"]},
        "db_tables": {
            "products": [{"id": 1, "name": "Widget", "price": 9.99}],
            "admin_secrets": [
                {"id": 1, "secret_key": "FLAG", "value": "FLAG{un10n_4tt4ck_m4st3r_2024}"},
            ],
            "users": [{"id": 1, "username": "admin", "password": "hunter2"}],
        },
        "flag": "FLAG{un10n_4tt4ck_m4st3r_2024}",
    },
    "nmap-fundamentals": {
        "target_host": "10.10.10.1",
        "open_ports": {
            22: {"service": "SSH", "version": "OpenSSH 8.2p1 Ubuntu"},
            80: {"service": "HTTP", "version": "Apache httpd 2.4.41"},
            443: {"service": "HTTPS", "version": "Apache httpd 2.4.41"},
            3306: {"service": "MySQL", "version": "MySQL 8.0.27"},
            8080: {"service": "HTTP-Proxy", "version": "Nginx 1.18.0"},
        },
        "os": "Linux 5.4.0 (Ubuntu 20.04)",
        "flag": "FLAG{nmap_r3c0n_m4st3r}",
    },
    "hash-cracking": {
        "hashes": [
            {"hash": "5f4dcc3b5aa765d61d8327deb882cf99", "type": "MD5", "plain": "password"},
            {"hash": "e10adc3949ba59abbe56e057f20f883e", "type": "MD5", "plain": "123456"},
            {"hash": "098f6bcd4621d373cade4e832627b4f6", "type": "MD5", "plain": "test"},
        ],
        "flag": "FLAG{h4sh_cr4ck1ng_m4st3r}",
    },
    "crypto-caesar-cipher": {
        "ciphertext_rot13": "Gur synt vf: FLAG{cl4ss1c4l_crypt0_cr4ck3d}",
        "ciphertext_caesar": "KHOOR ZRUOG",  # shift 3
        "flag": "FLAG{cl4ss1c4l_crypt0_cr4ck3d}",
    },
    "command-injection": {
        "flag_file": "FLAG{0s_cmnd_1nj3ct10n_rce}",
        "flag": "FLAG{0s_cmnd_1nj3ct10n_rce}",
    },
    "xss-reflected": {
        "flag": "FLAG{r3fl3ct3d_xss_pwn3d}",
        "admin_cookie": "session=FLAG{r3fl3ct3d_xss_pwn3d}; HttpOnly; Secure",
    },
    "wireshark-packet-analysis": {
        "flag": "FLAG{p4ck3t_4n4lys1s_pr0}",
        "captured_creds": {"username": "ftpuser", "password": "s3cur3p4ss"},
    },
    "steganography-basics": {
        "flag": "FLAG{st3g4n0gr4phy_d3t3ct3d}",
        "hidden_data": "Embedded message: FLAG{st3g4n0gr4phy_d3t3ct3d}",
    },
}


@router.post("/session")
def create_session(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lab_slug = payload.get("lab_slug")
    lab = db.query(Lab).filter(Lab.slug == lab_slug).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    session_id = str(uuid.uuid4())
    session = TerminalSession(
        user_id=current_user.id,
        lab_id=lab.id,
        session_id=session_id,
        history=[],
        environment=LAB_ENVIRONMENTS.get(lab_slug, {})
    )
    db.add(session)
    db.commit()

    return {
        "session_id": session_id,
        "welcome": f"🔐 CyberLab Terminal — {lab.title}\nType 'help' for available commands.\n",
        "target_info": _get_target_info(lab_slug)
    }


@router.post("/execute")
def execute_command(
    req: CommandRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(TerminalSession).filter(
        TerminalSession.session_id == req.session_id,
        TerminalSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    cmd = req.command.strip()
    output = _simulate_command(cmd, req.lab_slug, session)

    history = list(session.history or [])
    history.append({"cmd": cmd, "output": output, "ts": datetime.utcnow().isoformat()})
    session.history = history[-100:]  # Keep last 100
    session.last_active = datetime.utcnow()
    db.commit()

    return {"output": output, "command": cmd}


def _simulate_command(cmd: str, lab_slug: str, session: TerminalSession) -> str:
    env = LAB_ENVIRONMENTS.get(lab_slug, {})
    parts = cmd.split()
    if not parts:
        return ""
    tool = parts[0].lower()

    # Universal commands
    if tool == "help":
        return _help_text(lab_slug)
    if tool in ("clear", "cls"):
        return "\x1b[2J\x1b[H"
    if tool == "whoami":
        return "hacker@cyberlab"
    if tool == "pwd":
        return "/home/hacker"
    if tool == "ls":
        path = parts[1] if len(parts) > 1 else "/"
        files = env.get("files", {}).get(path, ["No files found"])
        return "  ".join(files)
    if tool == "cat":
        if len(parts) > 1 and "flag" in parts[1]:
            flag = env.get("flag_file") or env.get("flag", "")
            return flag if flag else "cat: flag.txt: Permission denied"
        return "cat: file not found"
    if tool == "echo":
        return " ".join(parts[1:])
    if tool == "date":
        return datetime.utcnow().strftime("%a %b %d %H:%M:%S UTC %Y")

    # NMAP simulation
    if tool == "nmap":
        return _simulate_nmap(cmd, env)

    # SQLmap simulation
    if tool == "sqlmap":
        return _simulate_sqlmap(cmd, env)

    # Curl / HTTP requests
    if tool == "curl":
        return _simulate_curl(cmd, env, lab_slug)

    # John the Ripper
    if tool == "john":
        return _simulate_john(cmd, env)

    # Hashcat
    if tool == "hashcat":
        return _simulate_hashcat(cmd, env)

    # Hash identification
    if tool in ("hash-identifier", "hashid"):
        return _simulate_hashid(cmd)

    # Python
    if tool == "python3" or tool == "python":
        return _simulate_python(cmd)

    # Steganography tools
    if tool == "steghide":
        return _simulate_steghide(cmd, env)
    if tool == "binwalk":
        return _simulate_binwalk(cmd, env)
    if tool == "exiftool":
        return _simulate_exiftool(cmd, env)
    if tool == "strings":
        return _simulate_strings(cmd, env)
    if tool == "file":
        return _simulate_file_cmd(cmd)

    # Wireshark / tcpdump
    if tool in ("wireshark", "tcpdump"):
        return f"[{tool}] Captured 1337 packets. Use display filters to analyze.\nFilter: http.request.method == POST → Found credentials!\nUsername: {env.get('captured_creds', {}).get('username', 'user')}\nPassword: {env.get('captured_creds', {}).get('password', 'pass')}"

    # Codec/base64
    if tool == "base64":
        if len(parts) > 1:
            try:
                import base64
                if "--decode" in cmd or "-d" in cmd:
                    text = parts[-1]
                    return base64.b64decode(text + "==").decode()
                else:
                    return base64.b64encode(parts[-1].encode()).decode()
            except:
                return "base64: invalid input"

    # ROT13
    if tool == "rot13":
        if len(parts) > 1:
            import codecs
            return codecs.encode(" ".join(parts[1:]), "rot_13")

    # Netcat
    if tool in ("nc", "netcat"):
        return f"[*] Connecting to {parts[1] if len(parts) > 1 else 'target'}...\n[*] Connection established\n[*] Interactive shell ready\n$ "

    # Metasploit
    if tool in ("msfconsole", "msfvenom"):
        return "       =[ metasploit v6.3.0-dev ]\n+ -- --=[ 2294 exploits ]\n[*] Simulated environment — real Metasploit not available\nmsf6 > "

    # Burpsuite proxy
    if tool == "burpsuite":
        return "[Burp Suite] Proxy started on 127.0.0.1:8080\nIntercept is ON\nNavigate your browser through the proxy to capture requests."

    return f"bash: {tool}: command not found. Type 'help' for available tools."


def _simulate_nmap(cmd: str, env: dict) -> str:
    target = env.get("target_host", "10.10.10.1")
    ports = env.get("open_ports", {})
    os_info = env.get("os", "Linux")

    if target not in cmd and "10.10" not in cmd:
        return f"NMAP: No target specified. Target: {target}"

    lines = [
        f"Starting Nmap 7.93 ( https://nmap.org )",
        f"Nmap scan report for target ({target})",
        f"Host is up (0.0023s latency).",
        "",
        "PORT      STATE  SERVICE        VERSION"
    ]

    for port, info in ports.items():
        state = "open"
        ver = info.get("version", "") if "-sV" in cmd or "-A" in cmd else ""
        lines.append(f"{port}/tcp   {state}  {info['service']:<14} {ver}")

    if "-O" in cmd or "-A" in cmd:
        lines += ["", f"OS: {os_info}"]

    if "--script vuln" in cmd or "-A" in cmd:
        lines += [
            "",
            "| vuln:",
            "|   CVE-2021-41773: Apache Path Traversal (CRITICAL)",
            "|_  CVE-2021-28041: OpenSSH Memory Corruption",
        ]

    lines += [
        "",
        f"Nmap done: 1 IP address (1 host up) scanned",
        f"FLAG hint: Combine service names → {env.get('flag', '')}"
    ]
    return "\n".join(lines)


def _simulate_sqlmap(cmd: str, env: dict) -> str:
    if "union" in cmd.lower() or "--dump" in cmd:
        tables = env.get("db_tables", {})
        output = ["[*] sqlmap found injectable parameter!", "[*] Dumping database...", ""]
        for table, rows in tables.items():
            output.append(f"Table: {table}")
            if rows:
                output.append("  " + " | ".join(rows[0].keys()))
                for row in rows:
                    output.append("  " + " | ".join(str(v) for v in row.values()))
            output.append("")
        return "\n".join(output)
    return "[*] sqlmap v1.7 running...\n[*] Testing parameter: id\n[+] Parameter 'id' is VULNERABLE to SQL injection\n[*] Use --dump to extract data or --tables to list tables"


def _simulate_curl(cmd: str, env: dict, lab_slug: str) -> str:
    if "login" in cmd and ("admin" in cmd or "'" in cmd):
        if "' OR" in cmd or "' --" in cmd or "--" in cmd:
            return "HTTP/1.1 200 OK\n\nWelcome, admin!\nSession token: eyJhbGc...\nRedirecting to /admin/dashboard"
        return "HTTP/1.1 401 Unauthorized\n\nInvalid credentials"

    if "search" in cmd or "q=" in cmd:
        query = re.search(r'q=([^&\s]+)', cmd)
        if query and ("<script>" in query.group(1) or "onerror" in query.group(1)):
            return f"HTTP/1.1 200 OK\n\n<html><body><h1>Search Results for: {query.group(1)}</h1></body></html>\n[!] XSS payload reflected!"

    return f"HTTP/1.1 200 OK\nContent-Type: text/html\n\n<html><body>Target application running</body></html>"


def _simulate_john(cmd: str, env: dict) -> str:
    hashes = env.get("hashes", [])
    output = ["Using default input encoding: UTF-8",
              "Loaded 3 password hashes with no different salts",
              "Press 'q' or Ctrl-C to abort...", ""]
    for h in hashes:
        output.append(f"{h['plain']:<20} ({h['hash'][:8]}...)")
    output += ["", f"3g 0:00:00:01 DONE (2024-01-01) 3.000g/s",
               "Session completed."]
    return "\n".join(output)


def _simulate_hashcat(cmd: str, env: dict) -> str:
    hashes = env.get("hashes", [])
    output = ["hashcat (v6.2.6) starting...",
              "OpenCL API (OpenCL 3.0) - Platform #1",
              "* Device #1: Simulated GPU",
              "",
              "Dictionary cache hit:",
              "* Filename..: rockyou.txt",
              "* Passwords.: 14344391",
              ""]
    for h in hashes:
        output.append(f"{h['hash']}:{h['plain']}")
    output += ["", "Session..........: hashcat",
               "Status...........: Cracked",
               f"Recovered........: {len(hashes)}/{len(hashes)} (100.00%)"]
    return "\n".join(output)


def _simulate_hashid(cmd: str) -> str:
    known = {
        "5f4dcc3b5aa765d61d8327deb882cf99": "MD5",
        "e10adc3949ba59abbe56e057f20f883e": "MD5",
    }
    parts = cmd.split()
    h = parts[1] if len(parts) > 1 else ""
    t = known.get(h, "Unknown")
    return f"Hash: {h}\nIdentified: [{t}]"


def _simulate_python(cmd: str) -> str:
    if "rot" in cmd.lower() or "rot13" in cmd.lower():
        import codecs
        m = re.search(r"encode\('(.+?)'", cmd)
        if m:
            return codecs.encode(m.group(1), "rot_13")
    if "base64" in cmd:
        return "SGVsbG8gV29ybGQ="
    if "ord" in cmd or "chr" in cmd:
        return "Python3 simulation: result = 65 → 'A'"
    return "Python 3.10.12\n>>> "


def _simulate_steghide(cmd: str, env: dict) -> str:
    if "extract" in cmd:
        return f"steghide: wrote extracted data to \"hidden.txt\".\nContents: {env.get('hidden_data', 'No hidden data found')}"
    return "steghide 0.5.1\nUsage: steghide extract -sf <file>"


def _simulate_binwalk(cmd: str, env: dict) -> str:
    return ("DECIMAL       HEXADECIMAL     DESCRIPTION\n"
            "0             0x0             JPEG image\n"
            "45823         0xB2FF          Zip archive data, at least v2.0 to extract, name: secret.txt\n"
            f">> Extracted: secret.txt → {env.get('hidden_data', 'Hidden data found!')}")


def _simulate_exiftool(cmd: str, env: dict) -> str:
    return ("ExifTool Version: 12.40\n"
            "File Name: mystery.jpg\n"
            "MIME Type: image/jpeg\n"
            "Image Width: 800\n"
            "Image Height: 600\n"
            f"Comment: {env.get('hidden_data', 'No comment')}\n"
            "GPS Latitude: 0 deg 0' 0.00\" N")


def _simulate_strings(cmd: str, env: dict) -> str:
    return (f"strings output:\n"
            "JFIF\nExif\n"
            f"{env.get('hidden_data', '')}\n"
            "Created with GIMP")


def _simulate_file_cmd(cmd: str) -> str:
    parts = cmd.split()
    f = parts[1] if len(parts) > 1 else "unknown"
    return f"{f}: JPEG image data, JFIF standard 1.01"


def _get_target_info(lab_slug: str) -> dict:
    env = LAB_ENVIRONMENTS.get(lab_slug, {})
    info = {}
    if "target_host" in env:
        info["target"] = env["target_host"]
    if "vulnerable_app" in env:
        info["web_app"] = "http://target.lab:80"
    return info


def _help_text(lab_slug: str) -> str:
    base = """╔══════════════════════════════════════╗
║        CyberLab Terminal Help        ║
╠══════════════════════════════════════╣
║ SYSTEM                               ║
║   whoami    - Current user           ║
║   ls [path] - List files             ║
║   cat [file]- Read file              ║
║   pwd       - Working directory      ║
║   echo      - Print text             ║
╠══════════════════════════════════════╣
║ WEB TOOLS                            ║
║   curl      - HTTP requests          ║
║   sqlmap    - SQL injection tool     ║
║   burpsuite - Web proxy              ║
╠══════════════════════════════════════╣
║ NETWORK TOOLS                        ║
║   nmap      - Port/service scanner   ║
║   tcpdump   - Packet capture         ║
║   nc        - Netcat                 ║
╠══════════════════════════════════════╣
║ CRYPTO & FORENSICS                   ║
║   hashcat   - Hash cracking          ║
║   john      - John the Ripper        ║
║   hash-identifier - Identify hashes  ║
║   base64    - Encode/decode          ║
║   rot13     - ROT13 encode/decode    ║
║   steghide  - Steganography          ║
║   binwalk   - Firmware analysis      ║
║   exiftool  - File metadata          ║
║   strings   - Extract strings        ║
║   python3   - Python interpreter     ║
╚══════════════════════════════════════╝"""
    return base
