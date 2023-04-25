import { useSendAndReceiveCustomEvent } from "./useSendAndReceiveCustomEvent";

export const useGetStatic = (get: any, eventName: string) => {
  useSendAndReceiveCustomEvent(eventName, () => get);
};
