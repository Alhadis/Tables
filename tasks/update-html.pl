#!/usr/bin/perl
use strict;
use warnings;

use utf8;
use open           qw< :std :utf8 >;
use charnames      qw< :full >;
use feature        qw< unicode_strings >;
use Getopt::Long   qw< :config auto_abbrev >;


# Parse CLI options
my $data_file;
my $template_file;
my $width;
GetOptions(
	"data=s"     => \$data_file,
	"template=s" => \$template_file,
	"width=i"    => \$width
);

open(my $tsv,      "<", $data_file)     or die("Can't open TSV file");
open(my $template, "<", $template_file) or die("Can't open HTML template");


# Read TSV into memory
my $tsv_data = do{
	local $/;
	<$tsv>;
};

# Convert into <td></td> sequences
$tsv_data =~ s/\\n/<br\/>/g;
$tsv_data =~ s/\s*$//g;
$tsv_data =~ s/\t/<\/td><td>/g;
$tsv_data =~ s/^/<tr><td>/gm;
$tsv_data =~ s/$/<\/td><\/tr>/gm;


# Load the HTML template
my $html_data = do{
	local $/;
	<$template>;
};

my $width_attr = " style=\"width: ${width}ch\"" if $width;
$html_data =~ s/
	(\t*)
	
	<table[^>]*>
		.*?
	(\t*<\/table>)/
	
	my $t = $1;
	"$t<table$width_attr>\n" . do{
		$tsv_data =~ s|^|$t\t|gms;
		$tsv_data;
	} . "\n$2"
	
/egmxsi;

# Reopen template's filehandle to write back over it
close($template);
open($template, ">", $template_file);
print $template $html_data;
