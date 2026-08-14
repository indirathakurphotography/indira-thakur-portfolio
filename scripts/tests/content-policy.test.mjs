import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeForPolicy,
  hasProhibitedLanguage,
  assertNoProhibitedLanguage,
  PROHIBITED_LANGUAGE_MESSAGE,
} from '../../src/lib/contentPolicy.ts';

test('normalization: case, leetspeak, separators, repeated letters', () => {
  assert.equal(normalizeForPolicy('  HeLLo  World  '), 'hello world');
  assert.equal(normalizeForPolicy('f.u.c.k'), 'f u c k');
  assert.equal(normalizeForPolicy('f-u-c-k'), 'f u c k');
  assert.equal(normalizeForPolicy('F U C K'), 'f u c k');
  assert.equal(hasProhibitedLanguage('F U C K').hit, true, 'spaced variant still detected');
  assert.equal(normalizeForPolicy('f4ck'), 'fack');
  assert.equal(normalizeForPolicy('sh1t'), 'shit');
  assert.equal(normalizeForPolicy('fuuuuuck'), 'fuck');
  assert.equal(normalizeForPolicy('a@ss'), 'aass');
});

test('normal text passes', () => {
  assert.equal(hasProhibitedLanguage('Luxury maternity & newborn photography in Mumbai.').hit, false);
  assert.equal(
    hasProhibitedLanguage({
      heading: 'Indira Thakur',
      story: 'A passionate storyteller documenting family milestones.',
    }).hit,
    false
  );
  assert.equal(hasProhibitedLanguage('11+ years, 500+ families, 100% satisfaction rating').hit, false);
  assert.equal(hasProhibitedLanguage('classic portraits').hit, false, 'no false positive on "classic"');
  assert.equal(hasProhibitedLanguage('gross anatomy of light').hit, false, 'no false positive on "gross"');
});

test('blocked words rejected', () => {
  for (const word of ['fuck', 'shit', 'asshole', 'bitch', 'cunt', 'nigger', 'whore', 'slut']) {
    assert.equal(hasProhibitedLanguage(`please ${word} this`).hit, true, `${word} should be blocked`);
  }
});

test('case variations rejected', () => {
  for (const variant of ['FUCK', 'Fuck', 'FuCk', 'ShIt', 'B I T C H', 'aSsHoLe']) {
    assert.equal(hasProhibitedLanguage(variant).hit, true, `${variant} should be blocked`);
  }
});

test('leet / separator / repeat evasions rejected', () => {
  for (const variant of ['f.u.c.k', 'f-u-c-k', 'F U C K', 's.h.i.t.', 'b!tch', 'fuuuuuck', 'n1gger']) {
    assert.equal(hasProhibitedLanguage(variant).hit, true, `${variant} should be blocked`);
  }
});

test('hostile phrase from incident rejected', () => {
  assert.equal(hasProhibitedLanguage('I am here to declare war on u all').hit, true);
  assert.equal(hasProhibitedLanguage('declare WAR on you').hit, true);
});

test('nested CMS payloads are walked recursively', () => {
  const payload = {
    about: {
      story: 'Everything is fine here.',
      stats: [{ label: 'Families', value: '500+' }],
    },
    seo: { metaTitle: 'Indira Thakur', metaDescription: 'this is such bullshit' },
  };
  const hit = hasProhibitedLanguage(payload);
  assert.equal(hit.hit, true);
  assert.match(hit.path || '', /bullshit|seo/);
});

test('assertNoProhibitedLanguage throws ApiError 400 with expected message', () => {
  try {
    assertNoProhibitedLanguage({ title: 'Totally FUCKING normal' });
    assert.fail('should have thrown');
  } catch (err) {
    assert.equal(err.status, 400);
    assert.match(err.message, /Failed to save: prohibited language detected/);
  }
  assertNoProhibitedLanguage({ title: 'Mumbai newborn photography' });
});

test('non-string and empty payloads are safe', () => {
  assert.equal(hasProhibitedLanguage(null).hit, false);
  assert.equal(hasProhibitedLanguage(42).hit, false);
  assert.equal(hasProhibitedLanguage([]).hit, false);
  assert.equal(hasProhibitedLanguage({}).hit, false);
  assert.equal(hasProhibitedLanguage('').hit, false);
});
