import { useEffect, useRef } from "react";

export default function GoogleAddressInput({ value, onChange, onSelect }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["geocode"],
        componentRestrictions: { country: "in" }
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      onSelect(place); // Return full place object
    });
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Start typing your address..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "10px",
        width: "100%",
        borderRadius: 6,
        border: "1px solid #ccc",
        marginBottom: 10
      }}
    />
  );
}
