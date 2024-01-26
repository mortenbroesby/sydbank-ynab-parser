import * as fs from 'fs-extra';
import * as path from 'path';
import * as csvWriterModule from 'csv-writer';
import * as csvTojsonModule from 'csvtojson';
import { mocked } from 'jest-mock';

// Mocking fs-extra
jest.mock('fs-extra');
const mockedFs = fs as jest.Mocked<typeof fs>;
mockedFs.readdirSync.mockReturnValue(['file1.csv', 'file2.csv'] as any);

// Mocking csv-writer
jest.mock('csv-writer');
const mockedCsvWriterModule = mocked(require('csv-writer'));
const mockedCsvWriter = {
  writeRecords: jest.fn().mockResolvedValue(undefined),
};
mockedCsvWriterModule.createObjectCsvWriter.mockReturnValue(mockedCsvWriter);

// Mocking csvtojson
const mockedJsonObject = [
  {
    Date: '2022-01-26',
    Text: 'Some Payee',
    Amount: '100.00',
  },
];

jest.mock('csvtojson', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    fromFile: jest.fn().mockResolvedValue(mockedJsonObject),
  }),
}));

// Mocking path
jest.mock('path');
const mockedPath = mocked(path);
mockedPath.join.mockImplementation((...paths) => paths.join('/'));

import {
  containsSubstring,
  getMappedPayee,
  replaceSubstring,
  titleCase,
} from './parse';

describe('containsSubstring', () => {
  describe.each([
    ['Hello, world!', 'world', true],
    ['Hello, world!', 'goodbye', false],
    ['Hello, world!', 'WORLD ', true],
  ])(
    'Given input string "%s" and target string "%s"',
    (input, target, expected) => {
      it(`When containsSubstring is called, Then it should return ${expected}`, () => {
        // When
        const result = containsSubstring(input, target);

        // Then
        expect(result).toBe(expected);
      });
    },
  );
});

describe('getMappedPayee', () => {
  describe.each([
    ['Lønoverførsel', 'Salary'],
    ['JYSK', 'Jysk'],
    ['JYSK Varme', 'Jysk Varme'],
    ['IKEA', 'Ikea'],
    ['ApCoA Dance PARTY', 'Apcoa Dance PARTY'],
  ])('Given input payee "%s"', (input, expected) => {
    it(`When getMappedPayee is called, Then it should return "${expected}"`, () => {
      // When
      const result = getMappedPayee(input);

      // Then
      expect(result).toBe(expected);
    });
  });
});

describe('titleCase', () => {
  describe.each([
    ['HELLO WORLD', 'Hello World'],
    ['hello world', 'hello world'],
    ['HELLO', 'Hello'],
    ['hello', 'hello'],
    ['HELLO WORLD THIS IS A TEST', 'Hello World This Is A Test'],
    ['hello world this is a test', 'hello world this is a test'],
  ])('Given input string "%s"', (input, expected) => {
    it(`When titleCase is called, Then it should return "${expected}"`, () => {
      // When
      const result = titleCase(input);

      // Then
      expect(result).toBe(expected);
    });
  });
});

describe('replaceSubstring', () => {
  describe.each([
    ['Hello, World!', new Map([['World', 'Earth']]), 'Hello, Earth!'],
    ['Hello, World!', new Map([['Mars', 'Earth']]), 'Hello, World!'],
    ['Hello, World!', new Map([['world', 'Earth']]), 'Hello, Earth!'],
    ['Hello MARIE!', new Map([['Hello', 'Goodbye']]), 'Goodbye MARIE!'],
  ])('Given input string "%s" and map', (inputPayee, payeeMap, expected) => {
    it(`When replaceSubstring is called, Then it should return "${expected}"`, () => {
      // When
      const result = replaceSubstring(inputPayee, payeeMap);

      // Then
      expect(result).toBe(expected);
    });
  });
});
