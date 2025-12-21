# Development commands (uses local DB)
dev-up:
	docker compose -f docker-compose.dev.yml up -d

dev-down:
	docker compose -f docker-compose.dev.yml down

dev-build:
	docker compose -f docker-compose.dev.yml build

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f

# Production commands (uses Docker DB)
prod-up:
	docker compose up -d

prod-down:
	docker compose down

prod-down-volumes:
	docker compose down --volumes

prod-build:
	docker compose build

prod-logs:
	docker compose logs -f

# Quick commands
restart:
	docker compose restart

status:
	docker compose ps
