# 👨‍👩‍👧‍👦 Family Command Center

A modern, interactive chore management system for families. Built with Vue.js and hosted on GitHub Pages.

![Family Command Center Demo](https://via.placeholder.com/800x400/607afb/ffffff?text=Family+Command+Center+Demo)

## 🌟 Features

- **📋 Drag & Drop Chore Assignment** - Easily assign chores to family members
- **⚡ Quick List** - Pre-configured common chores for rapid assignment  
- **💰 Earnings Tracking** - Automatic calculation of chore completion earnings
- **🎮 Electronics Management** - Track requirements for screen time privileges
- **🎉 Celebration System** - Confetti rewards for completed chores
- **📱 Responsive Design** - Works on desktop, tablet, and mobile
- **🗑️ Trash Can Deletion** - Drag unwanted chores to delete them

## 🎯 Chore Categories

- **🏠 Regular Chores** - Standard household tasks with monetary rewards
- **📚 School Chores** - Educational tasks that build good habits
- **⚡ Electronics Chores** - Must be completed to earn screen time

## 🚀 Live Demo

Visit the live application: [Family Command Center](https://siegemaster-ninsha.github.io/familycommandcenter.github.io/)

## 🛠️ Technology Stack

- **Frontend**: Vue.js 3 (CDN), Tailwind CSS
- **Backend**: AWS Lambda + API Gateway (serverless)
- **Database**: Amazon DynamoDB
- **Hosting**: GitHub Pages
- **Icons**: Phosphor Icons

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Pages  │───▶│   API Gateway    │───▶│   AWS Lambda    │
│   (Frontend)    │    │   (REST API)     │    │   (Business     │
│                 │    │                  │    │    Logic)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │   DynamoDB      │
                                                │   (Database)    │
                                                └─────────────────┘
```

## 🚀 Getting Started

### For Users
1. Visit the [live application](https://siegemaster-ninsha.github.io/familycommandcenter.github.io/)
2. Start adding chores and assigning them to family members
3. Track completion and celebrate achievements!

### For Developers
1. Clone this repository
2. Open `index.html` in your browser for the frontend
3. See `SECURITY.md` for backend deployment guidelines

## 📱 How to Use

### Assigning Chores
1. **From Quicklist**: Drag common chores directly to family members
2. **Create New**: Use "Add New Chore" button for custom tasks
3. **Drag & Drop**: Move chores between family members or back to unassigned

### Managing Electronics Time
- Complete **⚡ Electronics** chores to earn screen time
- Status shows clearly if electronics are earned or blocked
- Electronics privileges reset when new electronics chores are added

### Celebrating Success  
- Check off completed chores for instant confetti celebration
- Earnings automatically update with completion
- Success messages encourage continued participation

## 🔧 Configuration

The application can be configured via `config.js`:

```javascript
const CONFIG = {
  API: {
    BASE_URL: 'your-api-endpoint-here'
  },
  APP: {
    FAMILY_MEMBERS: ['Ben', 'Theo'], // Customize family members
    CONFETTI_PIECES: 300             // Celebration intensity
  }
};
```

## 🎨 Customization

### Adding Family Members
Update the `FAMILY_MEMBERS` array in `config.js` and the Vue.js application data.

### Modifying Chore Categories
Edit the category definitions in both frontend and backend code to add new types.

### Styling Changes
The application uses Tailwind CSS classes for styling. Modify the HTML classes to customize appearance.

## 📊 Data Privacy

- **Family-Internal Use Only** - No external data sharing
- **Local & Cloud Storage** - Data persists in secure AWS infrastructure
- **No Personal Information** - Only chore names and completion status stored
- **Secure API** - All communication over HTTPS

## 🔒 Security

This public repository only contains the frontend code. Backend deployment and sensitive configuration are handled separately. See `SECURITY.md` for detailed security guidelines.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Vue.js** - Reactive frontend framework
- **Tailwind CSS** - Utility-first CSS framework  
- **AWS** - Serverless backend infrastructure
- **GitHub Pages** - Free static site hosting
- **Phosphor Icons** - Beautiful icon set

## 📞 Support

If you encounter issues or have questions:
1. Check the `SECURITY.md` for security-related concerns
2. Review the configuration in `config.js`
3. Open an issue in this repository for bugs or feature requests

---

Built with ❤️ for families who want to make chore management fun and engaging!

## 🎉 Fun Stats

- **🎊 Confetti Pieces**: 300 per celebration
- **⚡ Electronics Categories**: 3 different chore types
- **🏠 Family Members Supported**: Unlimited (with code modification)
- **📱 Device Compatibility**: Desktop, tablet, mobile
- **🚀 Performance**: Serverless, scales automatically 