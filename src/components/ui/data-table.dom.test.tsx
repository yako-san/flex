import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import {
  DataTable,
  DataTableCell,
  DataTableHead,
  DataTableHeadCell,
  DataTableRow,
  RowGroup,
} from './data-table';

afterEach(() => cleanup());

describe('DataTable', () => {
  it('rend <table> wrappé dans <div overflow-x-auto>', () => {
    const { container } = render(<DataTable />);
    const wrap = container.firstChild as HTMLElement;
    expect(wrap.tagName).toBe('DIV');
    expect(wrap.className).toContain('overflow-x-auto');
    expect(wrap.querySelector('table')).toBeTruthy();
  });

  it('className custom mergé sur <table>', () => {
    const { container } = render(<DataTable className="my-table" />);
    expect(container.querySelector('table')?.className).toContain('my-table');
  });

  it('classes par défaut : w-full + text-sm', () => {
    const { container } = render(<DataTable />);
    expect(container.querySelector('table')?.className).toContain('w-full');
    expect(container.querySelector('table')?.className).toContain('text-sm');
  });
});

describe('DataTableHead', () => {
  it('rend <thead> sticky top-0', () => {
    const { container } = render(
      <table>
        <DataTableHead />
      </table>,
    );
    const thead = container.querySelector('thead');
    expect(thead).toBeTruthy();
    expect(thead?.className).toContain('sticky');
    expect(thead?.className).toContain('top-0');
  });

  it('lowercase + tracking-wider', () => {
    const { container } = render(
      <table>
        <DataTableHead />
      </table>,
    );
    const cls = container.querySelector('thead')?.className;
    expect(cls).toContain('lowercase');
    expect(cls).toContain('tracking-wider');
  });
});

describe('DataTableHeadCell', () => {
  it("align 'left' par défaut", () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <DataTableHeadCell>X</DataTableHeadCell>
          </tr>
        </thead>
      </table>,
    );
    expect(container.querySelector('th')?.className).toContain('text-left');
  });

  it("align 'right'", () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <DataTableHeadCell align="right">X</DataTableHeadCell>
          </tr>
        </thead>
      </table>,
    );
    expect(container.querySelector('th')?.className).toContain('text-right');
  });

  it("align 'center'", () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <DataTableHeadCell align="center">X</DataTableHeadCell>
          </tr>
        </thead>
      </table>,
    );
    expect(container.querySelector('th')?.className).toContain('text-center');
  });

  it('classes communes : border-b + font-semibold', () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <DataTableHeadCell>X</DataTableHeadCell>
          </tr>
        </thead>
      </table>,
    );
    const cls = container.querySelector('th')?.className;
    expect(cls).toContain('border-b');
    expect(cls).toContain('font-semibold');
  });
});

describe('DataTableRow', () => {
  it('rend <tr>', () => {
    const { container } = render(
      <table>
        <tbody>
          <DataTableRow />
        </tbody>
      </table>,
    );
    expect(container.querySelector('tr')).toBeTruthy();
  });

  it("zebra='even' → list-row-even", () => {
    const { container } = render(
      <table>
        <tbody>
          <DataTableRow zebra="even" />
        </tbody>
      </table>,
    );
    expect(container.querySelector('tr')?.className).toContain('list-row-even');
  });

  it("zebra='odd' → list-row-odd", () => {
    const { container } = render(
      <table>
        <tbody>
          <DataTableRow zebra="odd" />
        </tbody>
      </table>,
    );
    expect(container.querySelector('tr')?.className).toContain('list-row-odd');
  });

  it("zebra='highlight' → list-row-highlight", () => {
    const { container } = render(
      <table>
        <tbody>
          <DataTableRow zebra="highlight" />
        </tbody>
      </table>,
    );
    expect(container.querySelector('tr')?.className).toContain('list-row-highlight');
  });

  it("selected → bg-[var(--overlay-light-85)]", () => {
    const { container } = render(
      <table>
        <tbody>
          <DataTableRow selected />
        </tbody>
      </table>,
    );
    expect(container.querySelector('tr')?.className).toContain(
      'bg-[var(--overlay-light-85)]',
    );
  });

  it('hover effet (classe hover:bg-)', () => {
    const { container } = render(
      <table>
        <tbody>
          <DataTableRow />
        </tbody>
      </table>,
    );
    expect(container.querySelector('tr')?.className).toContain(
      'hover:bg-[var(--overlay-light-50)]',
    );
  });
});

describe('DataTableCell', () => {
  it("rend <td>", () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <DataTableCell>X</DataTableCell>
          </tr>
        </tbody>
      </table>,
    );
    expect(container.querySelector('td')).toBeTruthy();
  });

  it("align 'right' → text-right", () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <DataTableCell align="right">X</DataTableCell>
          </tr>
        </tbody>
      </table>,
    );
    expect(container.querySelector('td')?.className).toContain('text-right');
  });

  it("align 'center' → text-center", () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <DataTableCell align="center">X</DataTableCell>
          </tr>
        </tbody>
      </table>,
    );
    expect(container.querySelector('td')?.className).toContain('text-center');
  });

  it("mono=true → font-mono", () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <DataTableCell mono>X</DataTableCell>
          </tr>
        </tbody>
      </table>,
    );
    expect(container.querySelector('td')?.className).toContain('font-mono');
  });
});

describe('RowGroup', () => {
  it('rend une <tr> avec un <td> colSpan', () => {
    const { container } = render(
      <table>
        <tbody>
          <RowGroup label="NOUVEAU" colSpan={5} />
        </tbody>
      </table>,
    );
    const tr = container.querySelector('tr');
    const td = tr?.querySelector('td');
    expect(td?.getAttribute('colspan')).toBe('5');
  });

  it('label rendu en uppercase', () => {
    render(
      <table>
        <tbody>
          <RowGroup label="WIP" colSpan={3} />
        </tbody>
      </table>,
    );
    const cell = screen.getByText('WIP');
    expect(cell.className).toContain('uppercase');
  });

  it("count optionnel rendu entre parenthèses", () => {
    const { container } = render(
      <table>
        <tbody>
          <RowGroup label="FACTURÉ" count={12} colSpan={4} />
        </tbody>
      </table>,
    );
    expect(container.textContent).toContain('FACTURÉ');
    expect(container.textContent).toContain('(12)');
  });

  it("pas de count si non fourni → pas de parenthèses", () => {
    const { container } = render(
      <table>
        <tbody>
          <RowGroup label="X" colSpan={2} />
        </tbody>
      </table>,
    );
    expect(container.textContent).not.toContain('(');
  });

  it("count = 0 affiché (pas confondu avec absent)", () => {
    // null != 0, donc 0 doit s'afficher
    const { container } = render(
      <table>
        <tbody>
          <RowGroup label="X" count={0} colSpan={2} />
        </tbody>
      </table>,
    );
    expect(container.textContent).toContain('(0)');
  });
});
