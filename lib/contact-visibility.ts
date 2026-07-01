export function resolveVisiblePhoneNumber({
  currentUserPhone,
  hiddenContacts = [],
  hideFromContacts = false,
  phoneNumber,
}: {
  currentUserPhone?: string | null;
  hiddenContacts?: string[];
  hideFromContacts?: boolean;
  phoneNumber?: string | null;
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
