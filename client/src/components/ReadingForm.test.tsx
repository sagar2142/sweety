import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { ReadingForm } from './ReadingForm';

const TODAY = '2026-10-15';

function setup(props: Partial<Parameters<typeof ReadingForm>[0]> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(<ReadingForm today={TODAY} onSubmit={onSubmit} {...props} />);
  return {
    user,
    onSubmit: (props.onSubmit as typeof onSubmit | undefined) ?? onSubmit,
    dateInput: () => screen.getByLabelText('Date'),
    valueInput: () => screen.getByLabelText('Glucose value'),
    submit: () => user.click(screen.getByRole('button', { name: 'Add reading' })),
  };
}

describe('ReadingForm', () => {
  it("starts with today's date and an empty value", () => {
    const { dateInput, valueInput } = setup();
    expect(dateInput()).toHaveValue(TODAY);
    expect(valueInput()).toHaveValue(null);
  });

  it('shows "Please enter a glucose value." when the value is empty', async () => {
    const { user, submit, onSubmit } = setup();
    await user.click(screen.getByRole('radio', { name: /After lunch/ }));

    await submit();

    expect(screen.getByText('Please enter a glucose value.')).toBeInTheDocument();
    expect(screen.getByLabelText('Glucose value')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('asks for a time slot when none is chosen', async () => {
    const { user, submit, valueInput } = setup();
    await user.type(valueInput(), '120');

    await submit();

    expect(screen.getByText('Please choose a time slot.')).toBeInTheDocument();
  });

  it.each(['39', '601'])('rejects %s as out of range', async (value) => {
    const { user, submit, valueInput } = setup();
    await user.click(screen.getByRole('radio', { name: /After lunch/ }));
    await user.type(valueInput(), value);

    await submit();

    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
  });

  it('rejects decimal values', async () => {
    const { user, submit, valueInput } = setup();
    await user.click(screen.getByRole('radio', { name: /After lunch/ }));
    await user.type(valueInput(), '120.5');

    await submit();

    expect(screen.getByText('Value must be a whole number between 40 and 600 mg/dl.')).toBeInTheDocument();
  });

  it('rejects a date in the future', async () => {
    const { user, submit, dateInput, valueInput } = setup();
    await user.clear(dateInput());
    await user.type(dateInput(), '2026-10-16');
    await user.click(screen.getByRole('radio', { name: /After lunch/ }));
    await user.type(valueInput(), '120');

    await submit();

    expect(screen.getByText('Date cannot be in the future.')).toBeInTheDocument();
  });

  it('submits clean data and clears the value for the next reading', async () => {
    const { user, submit, onSubmit, valueInput } = setup();
    await user.click(screen.getByRole('radio', { name: /Morning \(fasting\)/ }));
    await user.type(valueInput(), '98');

    await submit();

    expect(onSubmit).toHaveBeenCalledWith({ date: TODAY, slot: 'morning_fasting', value: 98 });
    expect(valueInput()).toHaveValue(null);
    expect(screen.getByRole('radio', { name: /Morning \(fasting\)/ })).not.toBeChecked();
  });

  it('shows the error message returned by the server next to the right field', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError(409, 'You already have an After lunch reading for this date.', {
        slot: 'You already have an After lunch reading for this date.',
      }),
    );
    const { user, submit, valueInput } = setup({ onSubmit });
    await user.click(screen.getByRole('radio', { name: /After lunch/ }));
    await user.type(valueInput(), '150');

    await submit();

    expect(await screen.findByText('You already have an After lunch reading for this date.')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Time slot' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the daily limit message from the server', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError(409, 'You can add only 4 readings per day.', { date: 'You can add only 4 readings per day.' }),
    );
    const { user, submit, valueInput } = setup({ onSubmit });
    await user.click(screen.getByRole('radio', { name: /After dinner/ }));
    await user.type(valueInput(), '150');

    await submit();

    expect(await screen.findByText('You can add only 4 readings per day.')).toBeInTheDocument();
  });

  it('pre-fills the form when editing and calls onCancel', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <ReadingForm
        today={TODAY}
        initial={{ date: '2026-10-14', slot: 'after_dinner', value: 175 }}
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByLabelText('Date')).toHaveValue('2026-10-14');
    expect(screen.getByRole('radio', { name: /After dinner/ })).toBeChecked();
    expect(screen.getByLabelText('Glucose value')).toHaveValue(175);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
