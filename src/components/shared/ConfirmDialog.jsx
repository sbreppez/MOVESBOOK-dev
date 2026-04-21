import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { Modal } from './Modal';
import { Ic } from './Ic';

export const ConfirmDialog = ({
  title,
  body,
  icon = null,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  variant = "danger",
}) => {
  const { C } = useSettings();
  const t = useT();
  const _cancel = cancelLabel || t("cancel");
  const _confirm = confirmLabel || t("delete");

  const cancelBtnStyle = {
    flex: 1,
    padding: "10px",
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    fontSize: 13,
    color: C.text,
  };

  const confirmBtnStyle = {
    flex: 1,
    padding: "10px",
    background: variant === "danger" ? C.accent : C.surfaceHigh,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: FONT_DISPLAY,
    fontWeight: 900,
    fontSize: 13,
    color: variant === "danger" ? "#fff" : C.text,
  };

  return (
    <Modal title={title} onClose={onCancel}>
      <div style={{ textAlign: icon ? "center" : "left" }}>
        {icon && (
          <div style={{ marginBottom: 8 }}>
            <Ic n={icon} s={28} c={C.accent} />
          </div>
        )}
        <p style={{
          fontSize: 13,
          color: C.textSec,
          marginBottom: 16,
          lineHeight: 1.5,
          fontFamily: FONT_BODY,
        }}>
          {body}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={cancelBtnStyle}>{_cancel}</button>
          <button onClick={onConfirm} style={confirmBtnStyle}>{_confirm}</button>
        </div>
      </div>
    </Modal>
  );
};
