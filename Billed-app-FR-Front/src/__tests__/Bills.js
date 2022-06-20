/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import Bills from '../containers/Bills.js';
import BillsUI from '../views/BillsUI.js';
import { bills } from '../fixtures/bills.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import mockStore from '../__mocks__/store';
import router from '../app/Router.js';

jest.mock('../app/store', () => mockStore);

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    test('Then bill icon in vertical layout should be highlighted', async () => {
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      expect(windowIcon.classList.contains('active-icon').toBe(true));
    });
    test('Then bills should be ordered from earliest to latest', () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  describe('When I click on a New Bill', () => {
    it('should render the new bill creation form', () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const bills = new Bills({
        document,
        onNavigate,
        mockStore,
        localStorage,
      });
      const handleClickNewBill = jest.fn((e) => bills.handleClickNewBill(e));
      const addNewBill = screen.getByTestId('btn-new-bill');
      addNewBill.addEventListener('click', handleClickNewBill);
      userEvent.click(addNewBill);
      expect(handleClickNewBill).toHaveBeenCalled();
      expect(screen.queryByText('Envoyer une note de frais')).toBeTruthy();
    });
  });

  describe('When I click on the eye icon', () => {
    it('should render a modal', () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      document.body.innerHTML = BillsUI({ data: bills });
      const billsModal = new Bills({
        document,
        onNavigate,
        localStorage: window.localStorage,
      });
      const handleClickIconEye = jest.fn((icon) =>
        billsModal.handleClickIconEye(icon)
      );
      const modaleFile = document.getElementById('modaleFile');
      const iconEye = screen.getAllByTestId('icon-eye');
      $.fn.modal = jest.fn(() => modaleFile.classList.add('show'));
      iconEye.forEach((icon) => {
        icon.addEventListener('click', handleClickIconEye(icon));
        userEvent.click(icon);
        expect(handleClickIconEye).toHaveBeenCalled();
      });
      expect(modaleFile).toHaveClass('show');
    });
  });
});
