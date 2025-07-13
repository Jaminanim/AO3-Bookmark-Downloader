# AO3 Bookmarks Downloader

A Chrome extension that downloads your personal AO3 bookmarks as files while respecting server resources and rate limits.

## Installation

1. Download all files to a folder on your computer.
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right corner)
4. Click "Load unpacked" and select the folder containing the downloaded files
5. The extension will now appear in your Chrome toolbar

## Usage

1. Navigate to your AO3 bookmarks page (`https://archiveofourown.org/users/[username]/bookmarks`)
2. Click the extension icon in your Chrome toolbar
3. Select your preferred file format from the dropdown menu
4. Click "Start Download"

## Important Notes

### Download Behavior
This extension intentionally waits 1-3 seconds (randomized) between each download. This delay serves two critical purposes:
- **Server Protection**: Prevents overwhelming AO3's servers with simultaneous requests
- **Rate Limit Compliance**: Avoids triggering AO3's protective rate limiting systems

**Please do not modify the code to remove these delays.** ***Mass downloading without rate limiting can harm AO3's infrastructure and may result in your IP being temporarily blocked.***

### Storage Requirements
Downloading large bookmark collections may require significant storage space. A collection of 300 works can require up to 400 MB of disk space, depending on work lengths and chosen file format.

### Chrome Download Settings
For the best experience, configure Chrome to download files automatically:
1. Go to Chrome Settings > Downloads
2. Turn off "Ask where to save each file before downloading"
3. Set your download location to a dedicated folder (e.g., "AO3 Downloads")

This prevents Chrome from prompting you for a save location for each individual file, which becomes extremely tedious with large collections.

## Supported File Formats
- HTML (webpage format)
- EPUB (e-reader format)
- PDF (document format)
- MOBI (Kindle format)
- AZW3 (Newer Kindle Format)

## Ethical Use Guidelines

**This extension is designed exclusively for downloading your own bookmarks.** Please respect AO3's resources and community:

- ✅ **Do**: Download your personal bookmarks at a reasonable pace
- ❌ **Don't**: Use this tool to mass-download works you haven't bookmarked
- ❌ **Don't**: Modify the code to bypass rate limiting
- ❌ **Don't**: Use this for commercial data mining or AI training purposes

## Troubleshooting

**Downloads are failing or stopping:**
- Check if you've hit AO3's rate limits (wait 10-15 minutes before retrying)
- Ensure you're logged into AO3 and can access your bookmarks normally
- Verify your Chrome download settings allow automatic downloads

**Extension not appearing:**
- Ensure Developer mode is enabled in Chrome extensions
- Try refreshing the extensions page after loading
- Check that all extension files are in the same folder

**Downloads are very slow:**
- This is intentional behavior to protect AO3's servers
- Large collections will take considerable time (300 bookmarks ≈ 5-15 minutes)
- ***Do not attempt to speed up the process by running multiple instances***

## License

This software is released under a custom license that restricts commercial use and ensures ethical implementation. See the LICENSE file for full details.

---

*This extension is not affiliated with or endorsed by the Organization for Transformative Works or Archive of Our Own.*
