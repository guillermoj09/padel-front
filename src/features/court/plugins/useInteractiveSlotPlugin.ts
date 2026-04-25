type Slot = {
  dateRange: {
    start: string;
    end: string;
  };
};

export function useInteractiveSlotPlugin(
  openModal: (start: string, end: string) => void
) {
  return {
    name: 'interactive-slot-plugin',
    onTimeSlotClick: (ctx: unknown, slot: Slot) => {
      console.log('Slot clickeado:', slot);
      openModal(slot.dateRange.start, slot.dateRange.end);
      return true;
    },
  };
}
