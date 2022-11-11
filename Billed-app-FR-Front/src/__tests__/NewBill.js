/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from '@testing-library/dom';
import NewBillUI from '../views/NewBillUI.js';
import BillsUI from '../views/BillsUI.js';
import NewBill from '../containers/NewBill.js';
import mockStore from '../__mocks__/store';
import { ROUTES, ROUTES_PATH } from '../constants/routes';
import { localStorageMock } from '../__mocks__/localStorage.js';
import Store from '../app/Store';

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

describe('Given I am connected as an employee', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('When I submit a new Bill on correct format', () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        type: 'Employee',
      })
    );
    Object.defineProperty(window, 'location', {
      value: {
        hash: ROUTES_PATH['NewBill'],
      },
    });
    it.only('should submit with success', () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const newBill_test = new NewBill({
        document,
        onNavigate,
        store: Store,
        localStorage: window.localStorage,
      });
      const formNewBill = screen.getByTestId('form-new-bill');
      expect(formNewBill).toBeTruthy();
      const handleSubmit = jest.fn((e) => newBill_test.handleSubmit(e));
      formNewBill.addEventListener('submit', handleSubmit);
      fireEvent.submit(formNewBill);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('When an error occurs', () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        type: 'Employee',
      })
    );
    Object.defineProperty(window, 'location', {
      value: {
        hash: ROUTES_PATH['NewBill'],
      },
    });
    it('should fail with 500 message error', async () => {
      jest.spyOn(mockStore, 'bills');
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
          email: 'a@a',
        })
      );
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error('Erreur 500'));
          },
        };
      });
      const html = BillsUI({ error: 'Erreur 500' });
      document.body.innerHTML = html;
      const message = screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });

  describe('When I upload an incorrect file', () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        type: 'Employee',
      })
    );
    Object.defineProperty(window, 'location', {
      value: {
        hash: ROUTES_PATH['NewBill'],
      },
    });
    it('should fail the upload', () => {
      window.alert = jest.fn();
      const html = NewBillUI();
      document.body.innerHTML = html;
      const file = screen.getByTestId('file');
      const newBill = new NewBill({
        document,
        onNavigate,
        store: Store,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      file.addEventListener('change', handleChangeFile);
      fireEvent.change(file, {
        target: {
          files: [new File(['image'], 'test.pdf', { type: 'image/pdf' })],
        },
      });
      expect(file.value).toBe('');
    });
  });
});
