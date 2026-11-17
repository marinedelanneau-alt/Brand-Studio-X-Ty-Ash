import { expect, it } from "vitest";
import { NEW_OFFER_OPTION, setNewOfferDetail, getNewOfferDetail, removeNewOffer } from "../lib/priority-offer-detail";

it("restores the offer detail and keeps an independent Other answer when unchecked", () => {
  const otherAnswers = ["Autre", "__other_choice__:Une autre priorité"];
  const values = setNewOfferDetail([NEW_OFFER_OPTION, ...otherAnswers], "Une formation");
  expect(getNewOfferDetail(JSON.parse(JSON.stringify(values)))).toBe("Une formation");
  expect(removeNewOffer(values)).toEqual(otherAnswers);
  expect(setNewOfferDetail(values, "")).toEqual([NEW_OFFER_OPTION, ...otherAnswers]);
});
