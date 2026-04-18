// @ts-nocheck
"use client";

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView } from 'motion/react';

const animatedListStyles = `
.scroll-list-container { position: relative; width: 500px; }
.scroll-list { max-height: 400px; overflow-y: auto; padding: 16px; }
.scroll-list::-webkit-scrollbar { width: 8px; }
.scroll-list::-webkit-scrollbar-track { background: #120F17; }
.scroll-list::-webkit-scrollbar-thumb { background: #2F293A; border-radius: 4px; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.al-item { padding: 16px; background-color: #2F293A; border-radius: 8px; margin-bottom: 1rem; }
.al-item.selected { background-color: #2F293A; }
.al-item-text { color: white; margin: 0; }
.top-gradient { position: absolute; top: 0; left: 0; right: 0; height: 50px; background: linear-gradient(to bottom, #120F17, transparent); pointer-events: none; transition: opacity 0.3s ease; }
.bottom-gradient { position: absolute; bottom: 0; left: 0; right: 0; height: 100px; background: linear-gradient(to top, #120F17, transparent); pointer-events: none; transition: opacity 0.3s ease; }
`;

const AnimatedItem = ({ children, delay = 0, index, onMouseEnter, onClick }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.5, triggerOnce: false });
  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.2, delay }}
      style={{ marginBottom: '1rem', cursor: 'pointer' }}
    >
      {children}
    </motion.div>
  );
};

const AnimatedList = ({
  items = ['Item 1','Item 2','Item 3','Item 4','Item 5','Item 6','Item 7','Item 8','Item 9','Item 10','Item 11','Item 12','Item 13','Item 14','Item 15'],
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  className = '',
  itemClassName = '',
  displayScrollbar = true,
  initialSelectedIndex = -1
}) => {
  const listRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);

  const handleItemMouseEnter = useCallback(index => { setSelectedIndex(index); }, []);
  const handleItemClick = useCallback((item, index) => {
    setSelectedIndex(index);
    if (onItemSelect) onItemSelect(item, index);
  }, [onItemSelect]);

  const handleScroll = useCallback(e => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
  }, []);

  useEffect(() => {
    if (!enableArrowNavigation) return;
    const handleKeyDown = e => {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault(); setKeyboardNav(true);
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault(); setKeyboardNav(true);
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          if (onItemSelect) onItemSelect(items[selectedIndex], selectedIndex);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedItem) {
      const extraMargin = 50;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      if (itemTop < container.scrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (itemBottom > container.scrollTop + container.clientHeight - extraMargin) {
        container.scrollTo({ top: itemBottom - container.clientHeight + extraMargin, behavior: 'smooth' });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <>
      <style>{animatedListStyles}</style>
      <div className={`scroll-list-container ${className}`}>
        <div ref={listRef} className={`scroll-list ${!displayScrollbar ? 'no-scrollbar' : ''}`} onScroll={handleScroll}>
          {items.map((item, index) => (
            <AnimatedItem key={index} delay={0.1} index={index}
              onMouseEnter={() => handleItemMouseEnter(index)}
              onClick={() => handleItemClick(item, index)}>
              <div className={`al-item ${selectedIndex === index ? 'selected' : ''} ${itemClassName}`}>
                <p className="al-item-text">{item}</p>
              </div>
            </AnimatedItem>
          ))}
        </div>
        {showGradients && (
          <>
            <div className="top-gradient" style={{ opacity: topGradientOpacity }}></div>
            <div className="bottom-gradient" style={{ opacity: bottomGradientOpacity }}></div>
          </>
        )}
      </div>
    </>
  );
};

export default AnimatedList;
