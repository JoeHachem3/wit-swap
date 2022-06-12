import React from 'react';
import logo from '../../assets/logo.svg';
import classes from './Header.module.css';
import { IconButton, Tooltip } from '@mui/material';
import { Add, Menu } from '@mui/icons-material';
import ConnectWalletButton from '../ConnectWalletButton/ConnectWalletButton';
import { useState } from 'react';
import SideMenuDrawer from '../SideMenuDrawer/SideMenuDrawer';
import TabLink from '../TabLink/TabLink';
import TabLinkModel from '../../models/TabLinkModel';
import { routes } from '../../main';

const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  return (
    <>
      <nav className={classes['header']}>
        <div className={classes['logo-links']}>
          <div className={classes['image-container']}>
            <img src={logo} alt="" />
          </div>

          <div className={`${classes['links']} lg`}>
            {routes.map((route) => (
              <TabLink key={route.to} {...new TabLinkModel(route)} />
            ))}
          </div>
        </div>

        <div className={classes['actions']}>
          <ConnectWalletButton size="small" />
          <Tooltip title="Main Menu" enterDelay={1000}>
            <IconButton onClick={() => setIsDrawerOpen(true)}>
              <Menu />
            </IconButton>
          </Tooltip>
        </div>
      </nav>
      <SideMenuDrawer isOpen={isDrawerOpen} setIsOpen={setIsDrawerOpen} />
    </>
  );
};

export default Header;
