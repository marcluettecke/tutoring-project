<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/github_username/repo_name">
    <img src="./src/assets/logo_vertical.png" alt="Logo" width="250" height="250">
  </a>

<h3 align="center">PreparadorMMA</h3>

  <p align="center">
    Tutoring website for spanish engineering exam.
    <br />
    <a href="https://github.com/marcluettecke/tutoring-project"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://tutoring-service.netlify.app/">View Demo</a>
    ·
    <a href="https://github.com/marcluettecke/tutoring-project/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project
<div align="left">
  <a href="https://github.com/github_username/repo_name">
    <img src="https://i.ibb.co/c1FkV8G/tutoring-screenshot.png" alt="Logo" width="100%">
  </a>
</div>

<p align="right">(<a href="#top">back to top</a>)</p>



### Built With
* [Angular 20+](https://angular.io/) - Modern standalone components architecture
* [Firebase v9+ Modular SDK](https://firebase.google.com/) - Authentication and Firestore database
* [TypeScript 5.4+](https://www.typescriptlang.org/) - Type-safe development
* [RxJS](https://rxjs.dev/) - Reactive programming
* [Font Awesome](https://fontawesome.com/) - Icons
* [SCSS](https://sass-lang.com/) - Styling


<p align="right">(<a href="#top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

Just as usual, clone this repository to your local machine and start a terminal in the local folder to run:

```
cd tutoring-project
```

### Prerequisites

This project requires Node.js v20.19+ or v22.12+ for Angular 20 compatibility:
* [Node.js](https://nodejs.org/en/) - v20.19+ or v22.12+
* npm (comes with Node.js)

You can use nvm to manage Node versions:
```sh
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use the correct Node version
nvm install 24.3.0
nvm use 24.3.0
```

### Installation

1. To use your own firebase backend, you need to open a google account and get your firebase API key, this [link](https://stackoverflow.com/questions/37337512/where-can-i-find-the-api-key-for-firebase-cloud-messaging) provides a good instructions on where to find your credentials.
2. Clone the repo
   ```sh
   git clone https://github.com/github_username/repo_name.git
   ```
3. Install NPM packages
   ```sh
   npm install
   ```
4. Enter your own information in the ./src/environments files. You can copy/paste these information directly from firebase, as explained [here](https://developers.google.com/codelabs/building-a-web-app-with-angular-and-firebase#9)
  ```js
   export const environment = {
    firebase: {
    projectId: 'XXX',
    appId: 'XXX',
    storageBucket: 'XXX',
    locationId: 'XXX',
    apiKey: 'XXX',
    authDomain: 'XXX',
    messagingSenderId: 'XXX',
    measurementId: 'XXX',
  }
 ```

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

Start the development server:
```sh
npm start
```

The application will be available at `http://localhost:4200`

### Development Commands
```sh
npm start          # Start development server
npm run build      # Build for production
npm test           # Run unit tests
```

### Project Features
* **Question Practice**: Study with filtered questions by section and subsection
* **Randomized Tests**: Take timed practice exams with weighted question selection
* **Google Authentication**: Secure login with Google OAuth
* **Admin Panel**: Manage questions and content (admin users only)
* **Responsive Design**: Works on desktop and mobile devices
* **Real-time Scoring**: Immediate feedback with detailed explanations

This project can be adjusted to your own tutoring needs, or wherever you need some question service for multiple choice questions, a cloud backend to manage user and questions and a simple, yet intuitive interface for your users.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- User Test Generation - users can create their own randomized tests of the main sections
- User Test Statistics - give the user some feedback on past performances
- Allow for more generic questions, such as text input, etc...
Create an [open issues](https://github.com/github_username/repo_name/issues) for reporting issues and implementing additional features.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Marc Luettecke - [@MArcLuettecke](https://twitter.com/MarcLuettecke) - marc.luettecke1@gmail.com

Project Link: [https://github.com/marcluettecke/tutoring-project](https://github.com/marcluettecke/tutoring-project)

<p align="right">(<a href="#top">back to top</a>)</p>




<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/github_username/repo_name.svg?style=for-the-badge
[contributors-url]: https://github.com/github_username/repo_name/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/github_username/repo_name.svg?style=for-the-badge
[forks-url]: https://github.com/github_username/repo_name/network/members
[stars-shield]: https://img.shields.io/github/stars/github_username/repo_name.svg?style=for-the-badge
[stars-url]: https://github.com/github_username/repo_name/stargazers
[issues-shield]: https://img.shields.io/github/issues/github_username/repo_name.svg?style=for-the-badge
[issues-url]: https://github.com/github_username/repo_name/issues
[license-shield]: https://img.shields.io/github/license/github_username/repo_name.svg?style=for-the-badge
[license-url]: https://github.com/github_username/repo_name/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/linkedin_username
[product-screenshot]: images/screenshot.png
