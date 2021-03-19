Makefile: ;              # skip prerequisite discovery

.SILENT: ;               # no need for @
.ONESHELL: ;             # recipes execute in same shell
.NOTPARALLEL: ;          # wait for this target to finish


#################
# This task will be called on the PRODUCTION server
#################
#update-prod:
#		echo "RUN: update-prod"
#		make npm-client-install-production;
#		# remove swagger dock
#		cp .env.prod .env
#		cp prod.ecosystem.config.js ecosystem.config.js
#		node ace migration:run --force
#		make restart-pm2;
#		echo "READY!"
#
#update-staging:
#		echo "RUN: update-staging"
#		make npm-client-install-stage;
#		cp .env.stage .env
#		node ace migration:run --force
#		make restart-pm2-staging;
#		echo "READY!"

update-development:
		echo "RUN: update-development"
		make npm-client-install-dev;
		cp .env.dev .env
		NODE_ENV=development node ace migration:run --force
		make restart-pm2-development;
		echo "READY!"

#npm-client-install-stage:
#	    echo
#		echo "==== Running: npm install ===="
#		if test -f package.json; then\
#			npm "install"; \
#		else \
#			echo 'No package.json found'; \
#		fi;
#		echo
#		echo "==== Running: install Client DEVELOPMENT ===="
#		cd ./client && npm install && REACT_APP_ENV=staging npm run build
#		cd ../
#		rm -rf public/static
#		cp -rf client/build/* public/
#		mv public/index.html public/index.template

npm-client-install-dev:
	    echo
		echo "==== Running: npm install ===="
		if test -f package.json; then\
			npm "install"; \
		else \
			echo 'No package.json found'; \
		fi;

npm-client-install-production:
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
#restart-pm2-staging:
#		echo "==== Running: pm2 restart ecosystem.config.js --env staging ===="
#		if test -f ecosystem.config.js; then\
#			pm2 restart ecosystem.config.js --only breeze-staging --env staging;\
#        else \
#			echo 'No ecosystem.config.js found'; \
#        fi;


restart-pm2-development:
		echo "==== Running: pm2 restart ecosystem.config.js --env development ===="
		if test -f ecosystem.config.js; then\
			pm2 restart ecosystem.config.js --only breeze-development --env development;\
        else \
			echo 'No ecosystem.config.js found'; \
        fi;
