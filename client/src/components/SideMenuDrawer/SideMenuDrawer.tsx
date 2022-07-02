import React, { useEffect, useState, useRef } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  SwipeableDrawer,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useSelector } from '../../store/hooks';
import {
  defaultTokensSelector,
  userAddressSelector,
  userBalancesSelector,
} from '../../store/selectors';
import classes from './SideMenuDrawer.module.css';
import TokenDisplay from '../TokenDisplay/TokenDisplay';
import TokenDisplayModel from '../../models/TokenDisplayModel';
import bc from '../../utils/blockchain';
import TabLink from '../TabLink/TabLink';
import TabLinkModel from '../../models/TabLinkModel';
import { routes } from '../../main';
import { TokenModel } from '../../models/TokenModel';

const SideMenuDrawer: React.FC<{
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ isOpen, setIsOpen }) => {
  const defaultTokens = useSelector(defaultTokensSelector);
  const balances = useSelector(userBalancesSelector);
  const userAddress = useSelector(userAddressSelector);
  const [claimableTokens, setClaimableTokens] = useState<TokenModel[]>([]);

  useEffect(() => {
    if (userAddress) {
      Promise.all(
        defaultTokens.map((token) => bc.checkTokenEligibility(token.address))
      ).then((result) => {
        setClaimableTokens(
          defaultTokens.filter((token, index) => result[index])
        );
      });
    }
  }, [defaultTokens, userAddress, balances]);

  const iOS = useRef<boolean>(
    typeof navigator !== 'undefined' &&
      /iPad|iPhone|iPod/.test(navigator.userAgent)
  );

  return (
    <SwipeableDrawer
      disableBackdropTransition={!iOS.current}
      disableDiscovery={iOS.current}
      anchor="right"
      open={isOpen}
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
    >
      <div className={classes.container}>
        <div className={`${classes.links} md`}>
          {routes.map((route) => (
            <TabLink
              key={route.to}
              {...new TabLinkModel({ ...route, menuOrientation: 'vertical' })}
            />
          ))}
        </div>
        <hr className="md" />
        <Accordion
          disabled={!claimableTokens.length}
          className={classes.accordion}
          elevation={0}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <span>Claimable Tokens</span>
          </AccordionSummary>
          <AccordionDetails>
            <div className={classes.tokens}>
              {claimableTokens.map((token) => (
                <TokenDisplay
                  key={token.address}
                  {...new TokenDisplayModel({
                    tokenAddress: token.address,
                    onClick: () => bc.claimToken(token.address),
                    isClickable: true,
                    showAddress: true,
                  })}
                />
              ))}
            </div>
          </AccordionDetails>
        </Accordion>
      </div>
    </SwipeableDrawer>
  );
};

export default SideMenuDrawer;
