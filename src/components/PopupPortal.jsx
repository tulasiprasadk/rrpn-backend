import { createPortal } from "react-dom";

export default function PopupPortal({ children }) {
  return createPortal(
    children,
    document.body
  );
}
