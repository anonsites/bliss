export function resolveVisiblePhoneNumber({
  currentUserPhone,
  hiddenContacts = [],
  hideFromContacts = false,
  phoneNumber,
}) {
  if (!phoneNumber) {
    return undefined;
  }

  if (hideFromContacts) {
    return undefined;
  }

  const normalizedCurrentPhone = currentUserPhone?.trim();
  const normalizedHidden = hiddenContacts.map((value) => value.trim());

  if (normalizedCurrentPhone && normalizedHidden.includes(normalizedCurrentPhone)) {
    return undefined;
  }

  return phoneNumber;
}
