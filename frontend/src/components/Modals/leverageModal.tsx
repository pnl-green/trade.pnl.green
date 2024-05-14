import React, { useState } from 'react';
import { Box, ClickAwayListener, Slider } from '@mui/material';
import { IconsStyles, InnerBox, ModalWrapper } from './styles';
import { GreenBtn } from '@/styles/common.styles';
import { usePairTokensContext } from '@/context/pairTokensContext';

interface ModalProps {
  onClose: () => void;
}

const LeverageModal: React.FC<ModalProps> = ({ onClose }) => {
  //------Hooks------
  const { assetId, tokenPairData } = usePairTokensContext();
  let maxLeverage = Number(tokenPairData[assetId].universe.maxLeverage);

  const [sliderValue, setSliderValue] = useState<number>(0);

  const handleSliderChange = (event: any, newValue: number | number[]) => {
    if (
      typeof newValue === 'number' &&
      newValue >= 0 &&
      newValue <= maxLeverage
    ) {
      setSliderValue(newValue);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === '' ? 0 : Number(event.target.value);
    if (typeof value === 'number' && value >= 0 && value <= maxLeverage) {
      setSliderValue(value);
    }
  };

  return (
    <ModalWrapper>
      <ClickAwayListener onClickAway={onClose}>
        <InnerBox sx={{ width: '562px' }}>
          <Box
            id="closeIcon"
            sx={{
              ...IconsStyles,
              img: { width: '16px', height: '16px' },
              right: '20px',
              top: '15px',
            }}
            onClick={onClose}
          >
            <img src="/closeIcon.svg" alt="X" />
          </Box>
          <Box
            sx={{
              width: '100%',
              padding: '20px 30px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '20px',
              fontFamily: 'Sora',
            }}
          >
            Adjust Leverage
          </Box>
          <Box
            sx={{
              width: '100%',
              padding: '40px 30px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '14px',
              fontFamily: 'Sora',
              display: 'flex',
              flexDirection: 'column',

              p: {
                color: '#FFFFFF',
              },

              span: {
                mt: '20px',
                color: '#B04747',
              },
            }}
          >
            <p>
              Control the leverage used when opening positions for APE. The
              maximum leverage is 20x.
            </p>
            <span>
              Note that setting a higher leverage increases the risk of
              liquidation.
            </span>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                mt: '25px',
                gap: '20px',
                '.slider': {
                  mt: '-55px',
                },
                '.counterBox': {
                  display: 'flex',
                  border: '1px solid #8B8B8B',
                  borderRadius: '4px',
                  width: '54px',
                  height: '27px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  input: {
                    width: '100%',
                    height: '100%',
                    outline: 'none',
                    border: 'none',
                    borderRadius: 'inherit',
                    background: 'transparent',
                    color: '#fff',
                    textAlign: 'center',
                  },
                },
              }}
            >
              <Box sx={{ width: '300px' }} className="slider">
                <Slider
                  value={sliderValue}
                  onChange={handleSliderChange}
                  aria-label="custom thumb label"
                  valueLabelDisplay="off"
                  sx={{
                    '.MuiSlider-thumb': {
                      background: '#171717',
                      border: '1px solid #049260',
                      width: '24px',
                      height: '24px',
                    },
                    '.MuiSlider-rail': {
                      background: '#8B8B8B',
                      height: '6px',
                      borderRadius: '2px',
                    },
                    '.MuiSlider-track': {
                      background: '#049260',
                      border: 'none',
                    },
                  }}
                />
              </Box>
              <Box className="counterBox">
                <input
                  type="number"
                  value={sliderValue}
                  onChange={handleInputChange}
                />
              </Box>
            </Box>
          </Box>
          <GreenBtn
            sx={{
              m: '15px 30px',
              borderRadius: '7px',
              height: '42px',
              fontSize: '16px',
            }}
          >
            Connect
          </GreenBtn>
        </InnerBox>
      </ClickAwayListener>
    </ModalWrapper>
  );
};

export default LeverageModal;
