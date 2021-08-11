Makefile: ;              # skip prerequisite discovery

.SILENT: ;               # no need for @
.ONESHELL: ;             # recipes execute in same shell
.NOTPARALLEL: ;          # wait for this target to finish


#################
# This task will be called on the PRODUCTION server
#################
update-prod:
		echo "RUN: update-staging"
		make npm-client-install;
		cp .env.production .env
		# run migration
		NODE_ENV=production node ace migration:run --force
		# run clear
		node ace app:clear
		make restart-pm2-prod;
		echo "READY!"
#
update-staging:
		echo "RUN: update-staging"
		make npm-client-install;
		cp .env.staging .env
		# run migration
		NODE_ENV=staging node ace migration:run --force
		# run clear
		node ace app:clear
		make restart-pm2-staging;
		echo "READY!"

update-development:
		echo "RUN: update-development"
		make npm-client-install;
		cp .env.dev .env
		# run migration
		NODE_ENV=development node ace migration:run --force
		# run clear
		node ace app:clear
		make restart-pm2-development;
		echo "READY!"

npm-client-install:
		echo
		echo "==== Running: npm install ===="
		if test -f package.json; then\
			npm "install"; \
		else \
			echo 'No package.json found'; \
		fi;

#npm-client-install-production:
#		echo
#		echo "==== Running: npm install ===="
#		if test -f package.json; then\
#			npm "install"; \
#		else \
#			echo 'No package.json found'; \
#		fi;
#		echo
#		echo "==== Running: install Client PRODUCTION ===="
#		cd ./client && npm install && REACT_APP_ENV=production npm run build
#		cd ../
#		rm -rf public/static
#		cp -rf client/build/* public/
#		mv public/index.html public/index.template

#restart-pm2:
#		echo "==== Running: pm2 restart ecosystem.config.js --env production ===="
#		if test -f ecosystem.config.js; then\
#			pm2 restart ecosystem.config.js --env production;\
#        else \
#			echo 'No ecosystem.config.js found'; \
#        fi;
#


restart-pm2-prod:
		echo "==== Running: pm2 restart ecosystem.config.js --env staging ===="
		if test -f ecosystem.config.js; then\
			pm2 restart ecosystem.config.js --only breeze-prod --env production;\
        else \
			echo 'No ecosystem.config.js found'; \
        fi;


restart-pm2-staging:
		echo "==== Running: pm2 restart ecosystem.config.js --env staging ===="
		if test -f ecosystem.config.js; then\
			pm2 restart ecosystem.config.js --only breeze-staging --env staging;\
        else \
			echo 'No ecosystem.config.js found'; \
        fi;


restart-pm2-development:
		echo "==== Running: pm2 restart ecosystem.config.js --env development ===="
		if test -f ecosystem.config.js; then\
			pm2 restart ecosystem.config.js --only breeze-development --env development;\
        else \
			echo 'No ecosystem.config.js found'; \
        fi;
