# C-WAGS Trial Management System

A comprehensive web-based trial management system for the 17-year-old dog sports organization C-WAGS (Canine-Work And Games). This system digitizes paper-based processes for trial applications, scoring, record-keeping, and title progression tracking.

## 🚀 Quick Start

### Deploy to GitHub Pages

1. **Fork or create a new repository** with these files
2. **Upload your Excel data file** as `dataforsite.xlsx` in the root directory
3. **Enable GitHub Pages** in repository Settings → Pages → Source: GitHub Actions
4. **Enable GitHub Actions** in repository Settings → Actions → Allow all actions
5. **Visit your site** at `https://yourusername.github.io/repository-name`

### Data Management

The system automatically converts your Excel data to JSON when you update `dataforsite.xlsx`:

1. **Replace** `dataforsite.xlsx` with your updated file
2. **Commit** the changes to your repository
3. **GitHub Actions automatically converts** Excel → JSON
4. **Users see updated data** within 2-3 minutes

## 📊 Data Structure

Your Excel file should have the following columns in Sheet1:
- Column A: ID (registration number)
- Column B: Call name
- Column C: Full name
- Column D: Handler full name
- Column E: (empty/unused)
- Column F: Handler first name
- Column G: Handler last name
- Column H: (empty/unused)
- Column I: Class name
- Column J: (empty/unused)
- Column K: Judge name

## 🔧 System Features

### Phase 1 (Current - GitHub Pages)
- ✅ Trial application management
- ✅ Digital scoring system
- ✅ Title tracking & records
- ✅ Calendar scheduling
- ✅ Report generation
- ✅ Automatic data updates from Excel
- ✅ Mobile responsive design
- ✅ Offline capability

### Phase 2 (Future - Full Database)
- 🔄 Server-side authentication
- 🔄 Real-time synchronization
- 🔄 Advanced analytics
- 🔄 Email notifications
- 🔄 Multi-user permissions

## 📱 User Roles

- **Club Secretaries**: Full trial management for their club
- **Organization Administrators**: View all clubs and trials
- **Judges**: Access to assigned trial information
- **Advocates**: Access to class-specific information

## 🛠️ Technical Details

### Architecture
- **Frontend**: Pure HTML/CSS/JavaScript (no framework dependencies)
- **Data Storage**: Browser local storage + JSON files
- **Deployment**: GitHub Pages (static hosting)
- **CI/CD**: GitHub Actions for data processing

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 File Structure

```
repository/
├── index.html                 # Main application
├── dataforsite.xlsx          # Your Excel data file
├── .github/
│   └── workflows/
│       └── convert-excel-data.yml  # Auto-conversion workflow
├── data/                     # Auto-generated JSON files
│   ├── dataforsite.json     # Full Excel data as JSON
│   └── records.json         # Simplified records for app
└── README.md                # This file
```

## 🔄 Updating Data

### Method 1: Direct Upload (Recommended)
1. Go to your GitHub repository
2. Click "Upload files" or drag `dataforsite.xlsx` to replace the existing file
3. Commit changes
4. Wait 2-3 minutes for automatic processing

### Method 2: Git Command Line
```bash
git add dataforsite.xlsx
git commit -m "Update trial data"
git push origin main
```

## 📋 Forms Included

The system includes digital versions of all C-WAGS forms:
- Trial Application (Obedience/Rally/Games/Scent)
- Scent Trial Application (specialized)
- Trial Recap Report
- Judge Evaluation Forms
- Class Results Reports
- Score Sheets (all class types)

## 🎯 Getting Started for Users

1. **Dashboard**: Overview of all system metrics
2. **Trial Management**: Create and manage trials
3. **Applications**: Submit new trial applications
4. **Scoring**: Enter scores and results
5. **Records**: Track title progression
6. **Calendar**: View scheduled trials
7. **Reports**: Generate official documents

## 🆘 Support

### Common Issues

**Data not updating?**
- Check that GitHub Actions is enabled
- Verify the workflow ran successfully in the Actions tab
- Ensure `dataforsite.xlsx` is in the root directory

**Site not loading?**
- Verify GitHub Pages is enabled and deployed
- Check the repository is public (or you have GitHub Pro for private pages)
- Clear browser cache and reload

**Excel file format issues?**
- Ensure file is saved as `.xlsx` format
- Check that column structure matches expected format
- Verify no completely empty rows in the data

### Contact Information

For technical support or questions about the C-WAGS Trial Management System, please create an issue in this repository.

## 📄 License

This system is designed specifically for C-WAGS (Canine-Work And Games) organization. Usage should comply with C-WAGS policies and procedures.

---

**Last Updated**: December 2024  
**Version**: 1.0.0 (Phase 1 - GitHub Pages)  
**Compatibility**: All modern browsers, mobile-responsive
