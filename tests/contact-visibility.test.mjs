import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveVisiblePhoneNumber } from '../lib/contact-visibility.mjs';

test('shows contact when privacy allows it', () => {
  assert.equal(
    resolveVisiblePhoneNumber({
      currentUserPhone: '+2348000000000',
      hiddenContacts: [],
      phoneNumber: '+2348012345678',
    }),
    '+2348012345678',
  );
});

test('hides contact when the profile is marked private', () => {
  assert.equal(
    resolveVisiblePhoneNumber({
      currentUserPhone: '+2348000000000',
      hiddenContacts: [],
      hideFromContacts: true,
      phoneNumber: '+2348012345678',
    }),
    undefined,
  );
});

test('hides contact when the viewer was previously hidden by the profile owner', () => {
  assert.equal(
    resolveVisiblePhoneNumber({
      currentUserPhone: '+2348000000000',
      hiddenContacts: ['+2348000000000'],
      phoneNumber: '+2348012345678',
    }),
    undefined,
  );
});
