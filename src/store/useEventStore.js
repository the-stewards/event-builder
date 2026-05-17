import { create } from "zustand";
import { fetchEvents, fetchEvent, saveEvent } from "../utils/api";

export const useEventStore = create((set, get) => ({
  events: [],
  activeEventId: null,
  activeEvent: null,

  saveStatus: "saved",
  saveTimer: null,

  loadEvents: async () => {
    const { events } = await fetchEvents();
    set({ events });
  },

  setActiveEvent: async (id) => {
    const event = await fetchEvent(id);
    set({ activeEventId: id, activeEvent: event });
  },

  updateEvent: (updater) => {
    const current = get().activeEvent;
    if (!current) return;
    const updated = { ...current, ...updater, updatedAt: new Date().toISOString() };
    set({ activeEvent: updated, saveStatus: "saving" });

    clearTimeout(get().saveTimer);
    const timer = setTimeout(async () => {
      try {
        await saveEvent(updated);
        set({ saveStatus: "saved" });
      } catch {
        set({ saveStatus: "error" });
      }
    }, 800);
    set({ saveTimer: timer });
  },

  forceSave: async () => {
    const event = get().activeEvent;
    if (!event) return;
    set({ saveStatus: "saving" });
    try {
      await saveEvent(event);
      set({ saveStatus: "saved" });
    } catch {
      set({ saveStatus: "error" });
    }
  },

  addEvent: (event) => {
    set((state) => ({
      events: [...state.events, { id: event.id, name: event.name, date: event.date, status: event.status }],
      activeEventId: event.id,
      activeEvent: event,
    }));
  },

  removeEvent: (id) => {
    set((state) => {
      const events = state.events.filter((e) => e.id !== id);
      const isActive = state.activeEventId === id;
      return {
        events,
        activeEventId: isActive ? (events[0]?.id ?? null) : state.activeEventId,
        activeEvent: isActive ? null : state.activeEvent,
      };
    });
  },

  updateEventStatus: (status) => {
    const current = get().activeEvent;
    if (!current) return;
    get().updateEvent({ status });
    set((state) => ({
      events: state.events.map((e) =>
        e.id === current.id ? { ...e, status } : e
      ),
    }));
  },
}));
