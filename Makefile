all: test html

.PHONY: test


#==============================================================================
# MAIN VARIABLES
#==============================================================================

# Intended width of our ANSII table
width    := 160


# Project directories
fixtures := fixtures
tasks    := tasks

# Project files
datafile := $(fixtures)/sample-data.tsv


#==============================================================================
# MAIN TASKS
#==============================================================================

# Display an ANSII table in the terminal
test: $(datafile)
	@$(call print-ruler)
	@$(tasks)/run-test.js \
		--width $(width) \
		--config $(fixtures)/sample-borders.txt \
		< $^
	@$(call print-ruler, 1)


# Typist-friendly alias of the task below
html: $(fixtures)/dom.htm


# Update the HTML table used for comparison
$(fixtures)/dom.htm: $(datafile)
	@$(tasks)/update-html.pl $^ $@




#==============================================================================
# CONFIGURATION
#==============================================================================

# Width calculations
ttywidth := $(shell tput cols)
start    := 1
width    := $(if $(width),$(width),$(ttywidth))
calc     := "m=%s;z=%s;y=%s;s=z-1-(y/2);o=(1+s+y)-m;if(o>0){s-=o}else{s-=1};s"
unitws   := $(shell printf $(calc)$$'\n' \
	$(ttywidth) \
	$(width) \
	$(shell printf %s $(width) | wc -c) | bc)


# Formatting
colour-major  := $(shell tput setaf 7)
colour-minor  := $(shell tput setaf 8)



# Display the expected width of the table
define print-ruler
	$(if $(1),,$(call ruler-units))
	$(call ruler-frame,$(1))
	$(if $(1),$(call ruler-units))
endef


# Print a row of values alongside the ruler
define ruler-units
	printf %s $(colour-major)
	printf $(start)
	printf %$(unitws)s ''
	printf %s$$'\n' $(width)
	tput sgr0
endef


# Print the ruler's border
define ruler-frame
	printf %s $(colour-major)╞$(colour-minor)
	
	# Colour every 10th marker a brighter shade of grey
	printf %$(shell echo $(width)' - 2' | bc)s '' |\
		tr ' ' '$(if $(1),╤,╧)' |\
		sed -r 's/(.{9})./\1'$(colour-major)$(if $(1),╤,╧)$(colour-minor)'/g'
	
	printf %s$$'\n' $(colour-major)╡$(colour-minor)
	tput sgr0
endef
