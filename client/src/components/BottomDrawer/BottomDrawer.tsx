import React, { PropsWithChildren } from 'react';
import { Drawer } from '@mui/material';
import classes from './BottomDrawer.module.css';
import BottomDrawerModel from '../../models/BottomDrawerModel';

const BottomDrawer: React.FC<PropsWithChildren<BottomDrawerModel>> = (
  props = new BottomDrawerModel({})
) => (
  <Drawer
    anchor="bottom"
    className="bottom-drawer"
    open={props.open}
    onClose={props.onClose}
  >
    <div className={classes.content}>{props.children}</div>
  </Drawer>
);
export default BottomDrawer;
