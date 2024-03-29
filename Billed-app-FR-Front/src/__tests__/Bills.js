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

jest.mock('../app/store', () => {
  __esModule: true, mockStore;
});

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    beforeEach(() => {
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
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    test('Then bill icon in vertical layout should be highlighted', async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      expect(windowIcon.classList.contains('active-icon')).toBe(true);
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

describe('Given when I am a user connected as an Admin', () => {
  describe('When i navigate to Bills', () => {
    it('should fetch bills from the mock API GET', async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      localStorage.setItem(
        'user',
        JSON.stringify({ type: 'Admin', email: 'a@a' })
      );
      new Bills({
        document,
        onNavigate,
        mockStore,
        localStorage: window.localStorage,
      });
      document.body.innerHTML = BillsUI({ data: bills });
      await waitFor(() => screen.getByText('Mes notes de frais'));
      expect(screen.getByText('Mes notes de frais')).toBeTruthy();
    });
  });

  describe('When an error occurs on API', () => {
    beforeEach(() => {
      jest.spyOn(mockStore, 'bills');
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Admin',
          email: 'a@a',
        })
      );

      it('should fetch and fail with 404 error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 404'));
            },
          };
        });
        const html = BillsUI({ error: 'Error 404' });
        document.body.html = html;
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      it('should fetch and fail with 500 error'),
        async () => {
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list: () => {
                return Promise.reject(new Error('Erreur 500'));
              },
            };
          });
          const html = BillsUI({ error: 'Erreur 500' });
          document.body.innerHTML = html;
          const message = await screen.getByText(/Erreur 500/);
          expect(message).toBeTruthy();
        };
    });
  });
});
