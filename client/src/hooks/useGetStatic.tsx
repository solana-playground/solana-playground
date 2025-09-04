import { useSendAndReceiveCustomEvent } from "./useSendAndReceiveCustomEvent";

export const useGetStatic = (eventName: string, get: any) => {
  useSendAndReceiveCustomEvent(eventName, () => get);
};
