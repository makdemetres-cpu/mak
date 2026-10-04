# Getting FlipDesk running on your Windows PC

Follow the parts in order. The whole thing takes about 30 minutes, most of it waiting
for downloads. You never need to type code, except for one check in Part 1.

> If anything goes wrong, take a screenshot of the window or error and send it to Claude.
> The `.bat` files have not yet been run on a real Windows PC, so your first run is also
> their first test.

---

## Part 1 — Install Python (one time)

1. Open **https://www.python.org/downloads/** in your browser.
2. Click the big yellow **Download Python 3.x.x** button.
3. Open your **Downloads** folder and double-click the file you just downloaded
   (it's named like `python-3.x.x-amd64.exe`).
4. **Important.** On the first screen of the installer, at the bottom, **tick the box
   "Add python.exe to PATH"**. If you miss this, FlipDesk can't find Python.
5. Click **Install Now**. When Windows asks *"Do you want to allow this app to make
   changes?"*, click **Yes**.
6. Wait for "Setup was successful". If you see a button **Disable path length limit**,
   click it (click **Yes** if asked). Then click **Close**.
7. Check it worked:
   - Click **Start**, type `cmd`, and press **Enter**. A black window opens.
   - Type `python --version` and press **Enter**.
   - You should see `Python 3.x.x`. Close the black window.
   - If instead it says *"Python was not found"*, or the Microsoft Store opens:
     1. Go to **Settings → Apps → Advanced app settings → App execution aliases**.
     2. Turn **off** *python.exe* and *python3.exe*.
     3. Run the installer again: choose **Modify → Next**, tick
        **"Add Python to environment variables"**, then **Install**.

## Part 2 — Download FlipDesk with GitHub Desktop (one time)

1. Open **https://desktop.github.com** and click **Download for Windows**.
2. Open the downloaded file. It installs by itself and opens GitHub Desktop.
3. Click **Sign in to GitHub.com**. Your browser opens. Sign in to your GitHub account
   (**makdemetres-cpu**), click **Authorize desktop**, and allow the browser to switch
   back to GitHub Desktop.
4. On the "Configure Git" screen keep the suggested name and e-mail and click **Finish**.
5. In GitHub Desktop: click **File → Clone repository…**, then the **GitHub.com** tab.
6. Click **makdemetres-cpu/flipdesk** in the list.
7. Leave **Local path** as it is. It will be
   `C:\Users\<YourName>\Documents\GitHub\flipdesk`.
8. Click **Clone**.
9. Open the folder: click **Repository → Show in Explorer**. This folder is
   **your FlipDesk folder**. Every step below happens in it.

## Part 3 — First start

1. In your FlipDesk folder, double-click **`start.bat`**.
   - If a blue window says *"Windows protected your PC"*, click **More info → Run anyway**.
2. A black window opens. The **first time**, it spends 1–3 minutes installing the parts
   FlipDesk needs. Leave it alone.
3. Your browser opens the dashboard at **http://127.0.0.1:8765**. FlipDesk is in
   **PAPER mode**: the deals and sales you see are simulated, and nothing is ever bought
   or published.
4. You can close the black window. FlipDesk keeps running in the background.

The first run also created two files in your FlipDesk folder:

- **`.env`** — your secret keys (next part)
- **`config.yaml`** — your money rules (leave as is for now)

## Part 4 — Put your keys in `.env`

**Where the file is:**

```
C:\Users\<YourName>\Documents\GitHub\flipdesk\.env
```

It's in the same folder as `start.bat`. It stays on your PC. It is never uploaded to
GitHub, and you never paste these keys into a chat.

### 4a. Make file extensions visible (so you don't create `.env.txt` by mistake)

- **Windows 11:** in File Explorer click **View → Show → File name extensions**.
- **Windows 10:** in File Explorer click the **View** tab and tick **File name extensions**.

### 4b. Open `.env` in Notepad

Right-click **`.env`** → **Open with** → **Notepad**. If Notepad isn't listed, click
**Choose another app**, then **Notepad**.

You'll see four empty lines, like `TELEGRAM_BOT_TOKEN=`. Paste each value straight after
the `=`, with no spaces and no quotes.

### 4c. Telegram bot token → `TELEGRAM_BOT_TOKEN=`

1. In the Telegram app, search for **@BotFather** (it has a blue tick) and press **Start**.
2. Send `/newbot`.
3. When asked, give the bot a name, for example `FlipDesk`.
4. Then give it a username that ends in `bot`, for example `my_flipdesk_bot`.
5. BotFather replies with a token that looks like `123456789:AAH...`. Copy it.
6. Paste it after `TELEGRAM_BOT_TOKEN=`.

### 4d. Your Telegram user ID → `TELEGRAM_ALLOWED_USER_IDS=`

1. In Telegram, search for **@userinfobot** and press **Start**.
2. It replies with your **Id**, a number like `123456789`.
3. Paste that number after `TELEGRAM_ALLOWED_USER_IDS=`.
4. Now open **your new bot** in Telegram (tap the link BotFather gave you) and press
   **Start**. A Telegram bot can't message you until you've done this once.

### 4e. Claude API key → `ANTHROPIC_API_KEY=`

1. Go to **https://console.anthropic.com** and sign in or create an account.
2. Open **API keys**, click **Create Key**, and name it `FlipDesk`.
3. Copy the key. It starts with `sk-ant-` and is shown only once.
4. Paste it after `ANTHROPIC_API_KEY=`.
5. Add some credit under **Billing**. As a second safety net, set the console's
   **monthly spend limit** to **$10**. FlipDesk's own cap is also $10/month.

### 4f. OpenRouteService key → `OPENROUTESERVICE_API_KEY=`

1. Go to **https://openrouteservice.org/dev/#/signup** and sign up. Confirm your e-mail.
2. In the dashboard, create a token on the **Free** plan and name it `FlipDesk`.
3. Copy the token and paste it after `OPENROUTESERVICE_API_KEY=`.

The drive-time feature that uses this key is the next build phase. Storing the key now
is fine.

### 4g. Save and restart

When you're done, the file looks like this (these values are fake):

```
TELEGRAM_BOT_TOKEN=123456789:AAH-fake-example
TELEGRAM_ALLOWED_USER_IDS=123456789
ANTHROPIC_API_KEY=sk-ant-fake-example
OPENROUTESERVICE_API_KEY=fake-example
```

1. Press **Ctrl+S** to save, then close Notepad.
2. Double-click **`stop.bat`**, then **`start.bat`**, so FlipDesk reads the new keys.
3. Double-click **`status.bat`**. It should say **Telegram : connected**.
4. In Telegram, send `/status` to your bot. It should answer.

> **Keep `.env` private.** GitHub Desktop never lists it under *Changes*, because it is
> excluded on purpose. If you ever do see `.env` there, don't commit; ask Claude first.

## Part 5 — Keep it running 24/7 (one time)

1. **Auto-start.** Double-click **`install-autostart.bat`** and click **Yes** when
   Windows asks. You'll see *"Auto-start is ON"*. From now on, FlipDesk starts about a
   minute after Windows boots, even before you log in. If it ever crashes, it restarts
   by itself. To undo this, run `remove-autostart.bat`.
2. **Never sleep.**
   - **Windows 11:** **Settings → System → Power & battery → Screen and sleep**.
   - **Windows 10:** **Settings → System → Power & sleep**.
   - Set **"When plugged in, put my device to sleep after"** to **Never**. (The screen
     may still turn off; that's fine.)
3. **Laptop only — lid closed.**
   - Open **Control Panel → Power Options → Choose what closing the lid does**.
   - Set **When plugged in** to **Do nothing**, then **Save changes**.
4. **After a power cut (optional, desktop PCs).** In the BIOS/UEFI, set
   *"Restore on AC power loss"* to **Power On**, so the PC turns itself back on.
   FlipDesk then tells you on Telegram how long it was down.

FlipDesk only runs while the PC is on and online. Nothing runs while it's off.

## Everyday use

| You want to… | Do this |
|---|---|
| Open the dashboard | Double-click `start.bat` (it just opens the browser if FlipDesk is already running), or go to http://127.0.0.1:8765 |
| Stop FlipDesk | Double-click `stop.bat` |
| Check it's alive | Double-click `status.bat`, or send `/status` on Telegram |
| Get the latest version | GitHub Desktop → **Fetch origin** → **Pull origin**, then `stop.bat` and `start.bat` |
| Change money rules | Edit `config.yaml` with Notepad, then `stop.bat` and `start.bat` |

## If something goes wrong

- **"Python was not found"**: repeat Part 1, step 7.
- **The browser doesn't open, or `status.bat` says NOT running**: open the `logs`
  folder inside your FlipDesk folder. Send Claude `launcher.log` and `error.log`. FlipDesk
  never writes your keys into its logs, but glance through them before sending anyway.
- **Telegram says "error, retrying"**: check the token and ID in `.env` (no spaces), and
  make sure you pressed **Start** in your bot's chat. Then run `stop.bat` and `start.bat`.
