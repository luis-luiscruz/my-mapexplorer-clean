# Docker Image - MapExplorer Complete

This directory contains the Docker image for the MapExplorer Complete application with Android touch improvements.

## Files

- `mapexplorer-complete-latest.tar` (1.9 GB) - Docker image tar file with corrected port configuration

## What's Included

The Docker image contains:
- **Vue.js Frontend** with Android touch improvements
- **Python Backend** with Chrome/ChromeDriver for web scraping
- **Nginx** web server
- **Node.js 18** and **Python 3.11**
- All dependencies and scripts

## Key Improvements in This Version

### Android Touch Support
- Fixed popup button clickability on Android devices
- Added proper touch event handling
- Improved drag vs tap detection
- Enhanced mobile-responsive design

### Technical Changes
- Enhanced `CustomMapPopup.vue` with touch event support
- Improved `ChargerInfoPopup.vue` button interaction
- Added global touch CSS improvements
- Updated viewport meta tags for mobile

## How to Use

### Option 1: Load from Tar File
```bash
# Load the Docker image
docker load -i mapexplorer-complete-latest.tar

# Run the application
docker run --rm -p 3010:3010 mapexplorer-complete:latest
```

### Option 2: Use Docker Compose
```bash
# Load the image
docker load -i mapexplorer-complete-latest.tar

# Run with docker-compose
docker-compose up
```

## Access the Application

- **Application**: http://localhost:3010

## Testing Android Touch Improvements

1. Open the application on your Android device
2. Navigate to a charger marker on the map
3. Tap the marker to open the popup
4. Test clicking the buttons (Google Maps, MIIO, Analisar)
5. Verify that buttons are now clickable
6. Test dragging the popup by touching non-button areas

## Build Information

- **Image ID**: dd166f6a02aa
- **Size**: 1.87 GB
- **Created**: Latest build with touch improvements and corrected port configuration
- **Base**: Ubuntu 22.04 with Node.js 18 and Python 3.11

## Troubleshooting

If you encounter issues:

1. **Port conflicts**: Change the port mapping in the docker run command
2. **Permission issues**: Run with appropriate user permissions
3. **Memory issues**: Ensure Docker has enough allocated memory (at least 4GB recommended)

## Support

For issues or questions, refer to the main project documentation or create an issue in the repository. 