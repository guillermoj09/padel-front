// src/types/scheduleXPlugin.ts
import { timeSlotClickContext } from './timeSlotClickContext';
import { timeSlot } from './timeSlot';

export type Plugin = {
  name: string;
  onTimeSlotClick?: (ctx: timeSlotClickContext, slot: timeSlot) => boolean | void;
};
