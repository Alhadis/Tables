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
	@$(tasks)/ruler.pl --to $(width)
	@$(tasks)/run-test.js \
		--width $(width) \
		--config $(fixtures)/sample-borders.txt \
		< $^
	@$(tasks)/ruler.pl --to $(width) --inverted


# Typist-friendly alias of the task below
html: $(fixtures)/dom.htm


# Update the HTML table used for comparison
$(fixtures)/dom.htm: $(datafile)
	@$(tasks)/update-html.pl \
		--data=$^     \
		--template=$@ \
		--width=$(width)
