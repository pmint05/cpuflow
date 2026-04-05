import { Link } from 'react-router-dom';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@components/ui/breadcrumb';

export interface PageBreadcrumbItem {
	label: string;
	href?: string;
}

interface PageBreadcrumbProps {
	items: PageBreadcrumbItem[];
	className?: string;
}

export function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
	if (items.length === 0) return null;

	return (
		<Breadcrumb className={className}>
			<BreadcrumbList>
				{items.map((item, index) => {
					const isLast = index === items.length - 1;

					return (
						<PageBreadcrumbItem key={`${item.label}-${index}`} item={item} isLast={isLast} />
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}

function PageBreadcrumbItem({
	item,
	isLast,
}: {
	item: PageBreadcrumbItem;
	isLast: boolean;
}) {
	return (
		<>
			<BreadcrumbItem>
				{isLast || !item.href ? (
					<BreadcrumbPage>{item.label}</BreadcrumbPage>
				) : (
					<BreadcrumbLink asChild>
						<Link to={item.href}>{item.label}</Link>
					</BreadcrumbLink>
				)}
			</BreadcrumbItem>
			{!isLast && <BreadcrumbSeparator />}
		</>
	);
}
