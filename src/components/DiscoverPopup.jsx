import "./DiscoverPopup.css";

// The anchorRef is a ref to the ExploreItem DOM node
export default function DiscoverPopup({ item, onClose, anchorRef }) {
  if (!item || !anchorRef?.current) return null;

  // Get the position of the anchor (ExploreItem)
  const rect = anchorRef.current.getBoundingClientRect();
  const popupWidth = 320;
  const popupHeight = 180;
  const left = rect.left + rect.width / 2 - popupWidth / 2;
  const top = rect.top - popupHeight - 12; // 12px gap above the card

  return (
    <div className="discover-popup-absolute" style={{ left, top, width: popupWidth, position: 'fixed', zIndex: 10001 }}>
      <div className="discover-popup" onClick={e => e.stopPropagation()}>
        <h2>
          {item.icon} {item.title}
        </h2>
        <h4>{item.titleKannada}</h4>
        <p>{item.longInfo}</p>
        <p className="kn">{item.longInfoKannada}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
