import React from 'react';
import { NavLink } from 'react-router-dom';
import TabLinkModel from '../../models/TabLinkModel';
import classes from './TabLink.module.css';

const TabLink: React.FC<TabLinkModel> = (props = new TabLinkModel({})) => (
  <NavLink
    className={({ isActive }) =>
      isActive
        ? `${classes['active-link']} ${classes.link} ${
            classes[props.menuOrientation]
          }`
        : `${classes.link} ${classes[props.menuOrientation]}`
    }
    to={props.to}
  >
    {props.label}
  </NavLink>
);

export default TabLink;
