SELECT c.id, c.name, SUM(o.total) FROM customers c JOIN orders o ON o.customer_id = c.id
WHERE date_trunc('day', o.created_at) >= now() - interval '30 days' GROUP BY c.id, c.name ORDER BY 3 DESC LIMIT 50;
