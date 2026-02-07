/**
 * Input Component Tests
 */

import { render, screen } from '../../../__tests__/helpers/test-utils';
import userEvent from '@testing-library/user-event';
import { Input, Textarea } from '../Input';

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('should render input element', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should have default type as text', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should forward ref correctly', () => {
      const ref = { current: null };
      render(<Input ref={ref as any} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Label', () => {
    it('should render label when provided', () => {
      render(<Input label="Username" />);
      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('should associate label with input via htmlFor', () => {
      render(<Input label="Username" />);
      const label = screen.getByText('Username');
      const input = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', 'username');
      expect(input).toHaveAttribute('id', 'username');
    });

    it('should show required asterisk when required', () => {
      render(<Input label="Email" required />);
      const asterisk = screen.getByText('*');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveClass('text-red-500');
    });

    it('should not show asterisk when not required', () => {
      render(<Input label="Email" />);
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('should use custom id when provided', () => {
      render(<Input label="Email" id="custom-id" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'custom-id');
    });
  });

  describe('Input Types', () => {
    it('should render email type', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password type', () => {
      render(<Input type="password" />);
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it('should render number type', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('Error State', () => {
    it('should display error message when error prop is provided', () => {
      render(<Input label="Email" error="Invalid email" />);
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('should have error styles when error prop is provided', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
    });

    it('should show error instead of helperText when both provided', () => {
      render(
        <Input
          label="Email"
          error="Invalid email"
          helperText="Enter your email"
        />
      );
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
      expect(screen.queryByText('Enter your email')).not.toBeInTheDocument();
    });
  });

  describe('Helper Text', () => {
    it('should display helper text when provided', () => {
      render(<Input label="Email" helperText="We'll never share your email" />);
      expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
    });

    it('should have helper text styles', () => {
      render(<Input helperText="Helper text" />);
      const helper = screen.getByText('Helper text');
      expect(helper).toHaveClass('text-sm', 'text-gray-500');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should have disabled styles', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:bg-gray-50', 'disabled:opacity-50');
    });
  });

  describe('User Interactions', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup();
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello World');
      
      expect(input).toHaveValue('Hello World');
    });

    it('should call onChange handler', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should call onFocus handler', async () => {
      const handleFocus = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onFocus={handleFocus} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur handler', async () => {
      const handleBlur = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onBlur={handleBlur} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();
      
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper focus styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:ring-2');
    });

    it('should support aria-label', () => {
      render(<Input aria-label="Search" />);
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
    });

    it('should support aria-describedby with error', () => {
      render(<Input error="Error message" aria-describedby="error-id" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'error-id');
    });
  });

  describe('HTML Attributes', () => {
    it('should support name attribute', () => {
      render(<Input name="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'email');
    });

    it('should support value attribute', () => {
      render(<Input value="test value" onChange={() => {}} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('test value');
    });

    it('should support maxLength attribute', () => {
      render(<Input maxLength={10} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('should support pattern attribute', () => {
      render(<Input pattern="[0-9]*" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('pattern', '[0-9]*');
    });
  });
});

describe('Textarea Component', () => {
  describe('Basic Rendering', () => {
    it('should render textarea element', () => {
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should have default 4 rows', () => {
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '4');
    });

    it('should support custom rows', () => {
      render(<Textarea rows={10} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '10');
    });

    it('should forward ref correctly', () => {
      const ref = { current: null };
      render(<Textarea ref={ref as any} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });
  });

  describe('Label', () => {
    it('should render label when provided', () => {
      render(<Textarea label="Description" />);
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should associate label with textarea', () => {
      render(<Textarea label="Description" />);
      const label = screen.getByText('Description');
      const textarea = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', 'description');
      expect(textarea).toHaveAttribute('id', 'description');
    });

    it('should show required asterisk', () => {
      render(<Textarea label="Description" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Error and Helper Text', () => {
    it('should display error message', () => {
      render(<Textarea error="Description is required" />);
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    it('should have error styles', () => {
      render(<Textarea error="Error" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('border-red-500');
    });

    it('should display helper text', () => {
      render(<Textarea helperText="Max 500 characters" />);
      expect(screen.getByText('Max 500 characters')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup();
      render(<Textarea />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Multi-line\ntext content');
      
      expect(textarea).toHaveValue('Multi-line\ntext content');
    });

    it('should call onChange handler', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Textarea onChange={handleChange} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'test');
      
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Textarea disabled />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });
  });

  describe('HTML Attributes', () => {
    it('should support maxLength attribute', () => {
      render(<Textarea maxLength={500} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('maxLength', '500');
    });

    it('should support placeholder', () => {
      render(<Textarea placeholder="Enter description..." />);
      expect(screen.getByPlaceholderText('Enter description...')).toBeInTheDocument();
    });
  });
});
