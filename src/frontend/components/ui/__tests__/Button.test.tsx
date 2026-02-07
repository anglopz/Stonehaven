/**
 * Button Component Tests
 */

import { render, screen } from '../../../__tests__/helpers/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render with text', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should forward ref correctly', () => {
      const ref = { current: null };
      render(<Button ref={ref as any}>Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Variants', () => {
    it('should render primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-emerald-600');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-200');
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-gray-100');
    });

    it('should render danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
    });

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
    });

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12');
    });

    it('should render icon size', () => {
      render(<Button size="icon">Icon</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('should disable button when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show loading spinner with SVG element', () => {
      const { container } = render(<Button isLoading>Submit</Button>);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('animate-spin');
    });

    it('should not show loading when isLoading is false', () => {
      render(<Button isLoading={false}>Submit</Button>);
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should have disabled styles', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should be disabled when both disabled and isLoading are true', () => {
      render(<Button disabled isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click Me</Button>);

      await user.click(screen.getByText('Click Me'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} disabled>
          Click Me
        </Button>
      );

      await user.click(screen.getByText('Click Me'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} isLoading>
          Submit
        </Button>
      );

      await user.click(screen.getByText('Loading...'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle multiple clicks', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click Me</Button>);

      const button = screen.getByText('Click Me');
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should support custom type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Close">X</Button>);
      const button = screen.getByLabelText('Close');
      expect(button).toBeInTheDocument();
    });

    it('should support aria-disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });

    it('should have focus-visible ring', () => {
      render(<Button>Focus</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('Edge Cases', () => {
    it('should render without children', () => {
      render(<Button />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toBeEmptyDOMElement();
    });

    it('should render with complex children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should handle rapid state changes', () => {
      const { rerender } = render(<Button isLoading={false}>Submit</Button>);
      expect(screen.getByText('Submit')).toBeInTheDocument();

      rerender(<Button isLoading={true}>Submit</Button>);
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      rerender(<Button isLoading={false}>Submit</Button>);
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('should combine variant and size correctly', () => {
      render(
        <Button variant="danger" size="lg">
          Large Danger
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
      expect(button).toHaveClass('h-12');
    });
  });

  describe('HTML Attributes', () => {
    it('should support data attributes', () => {
      render(<Button data-testid="custom-button">Button</Button>);
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('should support id attribute', () => {
      render(<Button id="submit-button">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'submit-button');
    });

    it('should support name attribute', () => {
      render(<Button name="submit-btn">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('name', 'submit-btn');
    });

    it('should support form attribute', () => {
      render(<Button form="my-form">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('form', 'my-form');
    });
  });
});
