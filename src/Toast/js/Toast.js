import AlertError from '../../Icon/core/AlertError';
import AlertInfo from '../../Icon/core/AlertInfo';
import AlertSuccess from '../../Icon/core/AlertSuccess';
import classNames from 'classnames';
import React from 'react';
import ToastClose from '../../Icon/core/ToastClose';
import '../style/index.styl';

const ICONS = {
  error: AlertError,
  warning: AlertError,
  info: AlertInfo,
  success: AlertSuccess
};

export default function Toast({
  variant,
  children,
  closable,
  onClose,
  className
}) {
  let Icon = ICONS[variant];

  return (
    <div
      className={classNames(
        'spectrum-Toast',
        {['spectrum-Toast--' + variant]: variant},
        className
      )}>
      {Icon && <Icon size={null} className="spectrum-Toast-typeIcon" aria-label={variant} />}
      <div className="spectrum-Toast-content">{children}</div>
      {closable &&
        <button className="spectrum-Toast-closeButton" onClick={onClose}>
          <ToastClose size={null} />
        </button>
      }
    </div>
  );
}
