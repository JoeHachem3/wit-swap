import React from 'react';
import classes from './Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={classes.Footer}>
      <p>
        Made with Dedication by{' '}
        <a href="https://github.com/JoeHachem3">@JoeHachem3</a>
      </p>
    </footer>
  );
};

export default Footer;
