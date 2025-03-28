import React, { useState } from 'react'
import { Box } from '@mui/material';

const DEFAULT_ICON_COLOR = "#FFFFFF";

const SSOButton = (props) => {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = () => {
    setHovered(true);
    props.onMouseEnter?.();
  };

  const handleMouseLeave = () => {
    setHovered(false);
    props.onMouseLeave?.();
  };

  const handleFocus = () => setFocused(true);
  const handleBlur = () => setFocused(false);
  const handleClick = () => props.onClick?.();

  const {
    activeStyle,
    align = "left",
    text,
    children = text,
    className,
    icon,
    iconFormat,
    iconSize = "26px",
    iconColor = DEFAULT_ICON_COLOR,
    preventActiveStyles = false,
    size = "50px",
    style: customStyle,
    disabled,
    type = "button",
  } = props;

  const buttonStyles = computeButtonStyles(styles.button, {
    activeStyle: preventActiveStyles ? customStyle : activeStyle,
    customStyle,
    active: hovered || focused,
    size,
  });

  return (
    <button
      style={buttonStyles}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...{ className, disabled, type }}
    >
      <div style={styles.flex}>
        {!isZeroPx(iconSize) && !!icon && (
          <Box
            style={{
              display: "flex",
              justifyContent: "center",
              minWidth: iconSize,
            }}
            sx={{ borderRight: "#c7c7c7 1px solid", pr: 1 }}
          >
            <DynamicIcon type={icon} size={iconSize} format={iconFormat} color={iconColor} />
          </Box>
        )}
        {!isZeroPx(iconSize) && <div style={styles.divider} />}
        <div style={{ textAlign: align, width: "100%" }}>{children}</div>
      </div>
    </button>
  )
}

export default SSOButton;

const isZeroPx = (size) => size === "0" || size === "0px" || size === 0;

const computeButtonStyles = (
  defaults = {},
  {
    size,
    customStyle,
    active,
    activeStyle,
  }
) => ({
  ...defaults,
  height: size,
  ...customStyle,
  ...(active && activeStyle),
});

const styles = {
  button: {
    display: "block",
    border: 0,
    borderRadius: 3,
    boxShadow: "rgba(0, 0, 0, 0.5) 0 1px 2px",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "19px",
    margin: "5px",
    width: "calc(100% - 10px)",
    overflow: "hidden",
    padding: "0 10px",
    userSelect: "none",
  },
  divider: {
    width: "10px",
  },
  flex: {
    alignItems: "center",
    display: "flex",
    height: "100%",
  },
};

const DynamicIcon = ({ type: Component, size, format, color = "#FFFFFF" }) => {
  const renderIElement = typeof Component === "string";

  return renderIElement ? (
    <Icon {...{ format, name: Component, size }} />
  ) : (
    <Component size={size} color={color} />
  );
};
