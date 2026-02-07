/**
 * Card Component Tests
 */

import { render, screen } from '../../../__tests__/helpers/test-utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../Card';

describe('Card Component', () => {
  describe('Basic Rendering', () => {
    it('should render card with children', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should have default card styles', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('rounded-xl', 'border', 'bg-white', 'shadow-sm');
    });

    it('should support custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });

    it('should forward ref correctly', () => {
      const ref = { current: null };
      render(<Card ref={ref as any}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Hover Effect', () => {
    it('should add hover styles when hover prop is true', () => {
      const { container } = render(<Card hover>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('hover:-translate-y-1', 'hover:shadow-lg');
    });

    it('should not have hover styles by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass('hover:-translate-y-1');
    });

    it('should not have hover styles when hover is explicitly false', () => {
      const { container } = render(<Card hover={false}>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass('hover:-translate-y-1');
    });
  });

  describe('CardHeader', () => {
    it('should render header with children', () => {
      render(<CardHeader>Header Content</CardHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('should have padding styles', () => {
      const { container } = render(<CardHeader>Content</CardHeader>);
      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass('p-6', 'pb-4');
    });

    it('should forward ref correctly', () => {
      const ref = { current: null };
      render(<CardHeader ref={ref as any}>Content</CardHeader>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardTitle', () => {
    it('should render title with children', () => {
      render(<CardTitle>Title Text</CardTitle>);
      expect(screen.getByText('Title Text')).toBeInTheDocument();
    });

    it('should render as h3 element', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title.tagName).toBe('H3');
    });

    it('should have title styles', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('text-2xl', 'font-bold', 'text-gray-900');
    });

    it('should forward ref correctly', () => {
      const ref = { current: null };
      render(<CardTitle ref={ref as any}>Title</CardTitle>);
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });
  });

  describe('CardDescription', () => {
    it('should render description with children', () => {
      render(<CardDescription>Description text</CardDescription>);
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('should render as p element', () => {
      render(<CardDescription>Description</CardDescription>);
      const desc = screen.getByText('Description');
      expect(desc.tagName).toBe('P');
    });

    it('should have description styles', () => {
      render(<CardDescription>Description</CardDescription>);
      const desc = screen.getByText('Description');
      expect(desc).toHaveClass('text-sm', 'text-gray-600');
    });

    it('should forward ref correctly', () => {
      const ref = { current: null };
      render(<CardDescription ref={ref as any}>Description</CardDescription>);
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe('CardContent', () => {
    it('should render content with children', () => {
      render(<CardContent>Main content</CardContent>);
      expect(screen.getByText('Main content')).toBeInTheDocument();
    });

    it('should have content padding styles', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      const content = container.firstChild as HTMLElement;
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('should forward ref correctly', () => {
      const ref = { current: null };
      render(<CardContent ref={ref as any}>Content</CardContent>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardFooter', () => {
    it('should render footer with children', () => {
      render(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('should have footer styles', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      const footer = container.firstChild as HTMLElement;
      expect(footer).toHaveClass('border-t', 'bg-gray-50', 'p-6');
    });

    it('should have flexbox layout', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      const footer = container.firstChild as HTMLElement;
      expect(footer).toHaveClass('flex', 'items-center');
    });

    it('should forward ref correctly', () => {
      const ref = { current: null };
      render(<CardFooter ref={ref as any}>Footer</CardFooter>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Composition', () => {
    it('should render complete card with all parts', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>Main content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Card description')).toBeInTheDocument();
      expect(screen.getByText('Main content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('should work with partial composition', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title Only</CardTitle>
          </CardHeader>
          <CardContent>Content Only</CardContent>
        </Card>
      );

      expect(screen.getByText('Title Only')).toBeInTheDocument();
      expect(screen.getByText('Content Only')).toBeInTheDocument();
      expect(screen.queryByText('Footer')).not.toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('should support data attributes on Card', () => {
      render(<Card data-testid="test-card">Content</Card>);
      expect(screen.getByTestId('test-card')).toBeInTheDocument();
    });

    it('should support onClick on Card', () => {
      const handleClick = jest.fn();
      const { container } = render(<Card onClick={handleClick}>Content</Card>);
      const card = container.firstChild as HTMLElement;
      card.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should support id attribute', () => {
      const { container } = render(<Card id="my-card">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('id', 'my-card');
    });
  });

  describe('Edge Cases', () => {
    it('should render empty card', () => {
      const { container } = render(<Card />);
      const card = container.firstChild as HTMLElement;
      expect(card).toBeInTheDocument();
      expect(card).toBeEmptyDOMElement();
    });

    it('should handle complex nested content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>
              <span>Complex</span> <strong>Title</strong>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p>Paragraph 1</p>
              <p>Paragraph 2</p>
            </div>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    });

    it('should preserve className merging order', () => {
      const { container } = render(
        <Card className="bg-blue-500">Content</Card>
      );
      const card = container.firstChild as HTMLElement;
      // Custom className should be applied along with base classes
      expect(card).toHaveClass('bg-blue-500');
      expect(card).toHaveClass('rounded-xl');
    });
  });
});
