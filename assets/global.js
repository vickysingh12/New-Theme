
export const overlay = () => {
  const dom = {};

  const cacheDom = () => {
    dom.overlay = document.querySelector('.js-overlay');
  };

  // Define overlayAction at the top level so it can be exported
  const overlayAction = () => {
    dom.overlay.classList.toggle('is-active');
  };

  const bindUIActions = () => {
    // Possibly other bindings can go here
  };

  cacheDom();
  bindUIActions();

  // Export overlayAction function to be accessible from other modules
  return { overlayAction };
};