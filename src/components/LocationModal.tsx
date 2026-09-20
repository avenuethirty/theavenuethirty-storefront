import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Navigation } from 'lucide-react';
import { useDeliveryLocation } from '../context/LocationContext';
import { PAKISTAN_CITIES } from '../utils/pakistanCities';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose }) => {
  const { city, postalCode, isDetecting, error, setLocation, detect } = useDeliveryLocation();
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(city);
  const [selectedPostal, setSelectedPostal] = useState(postalCode || '');

  useEffect(() => {
    if (isOpen) {
      setSelectedCity(city);
      setSelectedPostal(postalCode || '');
      setSearch('');
    }
  }, [isOpen, city, postalCode]);

  const popularCities = PAKISTAN_CITIES.slice(0, 8).filter((c) => c.name.toLowerCase() !== city.toLowerCase());

  const filtered = useMemo(() => {
    if (!search.trim()) return PAKISTAN_CITIES;
    const q = search.toLowerCase();
    return PAKISTAN_CITIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [search]);

  const handleSave = () => {
    if (!selectedCity.trim()) return;
    const matched = PAKISTAN_CITIES.find((c) => c.name.toLowerCase() === selectedCity.trim().toLowerCase());
    setLocation(matched ? matched.name : selectedCity.trim(), matched?.postalCode || selectedPostal || undefined);
    onClose();
  };

  const handleDetect = async () => {
    await detect();
    setSelectedCity(city);
    setSelectedPostal(postalCode || '');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
              <h3 className="text-base font-bold text-[#1A1A1A]">Select Delivery Location</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <p className="text-xs text-neutral-500 leading-relaxed">
                Select your city to view accurate delivery timelines and shipping fees across Pakistan.
              </p>

              <button
                onClick={handleDetect}
                disabled={isDetecting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A1A1A] text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDetecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    Detect My Location
                  </>
                )}
              </button>

              {error && (
                <p className="text-[11px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              {city && !error && (
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 text-[11px] font-medium rounded-full border bg-[#1A1A1A] text-white border-[#1A1A1A]">
                    {city}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5">Or search manually:</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Enter city name or postal code..."
                  className="w-full border border-neutral-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-neutral-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-2">Popular Cities:</label>
                <div className="flex flex-wrap gap-2">
                  {(search.trim() ? filtered : popularCities).map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        setSelectedCity(c.name);
                        setSelectedPostal(c.postalCode || '');
                      }}
                      className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors cursor-pointer ${
                        selectedCity.toLowerCase() === c.name.toLowerCase()
                          ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                          : 'bg-white text-[#1A1A1A] border-neutral-300 hover:border-neutral-800'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedCity && (
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5">Postal Code (optional):</label>
                  <input
                    type="text"
                    value={selectedPostal}
                    onChange={(e) => setSelectedPostal(e.target.value)}
                    placeholder="e.g. 51310"
                    className="w-full border border-neutral-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-neutral-800 bg-white"
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-black/5 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-[#1A1A1A] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedCity.trim()}
                className="px-5 py-2 bg-[#1A1A1A] text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-40 cursor-pointer"
              >
                Save Location
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
