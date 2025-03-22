import os
import sys
import cson

def pair_recipes(masterdir):
	recipedir = "{}/recipe-converter/recipes/".format(masterdir)
	atomdir = "{}/object-fetcher/atoms/".format(masterdir)
	for root, dirs, files in os.walk(recipedir): # checks all files and folders in the base folder
		for file in files:
			CSONfile = cson.load(file)
			if file.find('template_name: "{}"\n'.format(oname)) != -1:
				print("		found {}".format(oname))
if (__name__ == "__main__"):
	masterdir = os.path.normpath(os.getcwd() + os.sep + os.pardir).replace("\\","/")
	currdir = os.getcwd()


	print("Running object-fetcher...")
	os.system("cd {}".format(masterdir))
	os.system("cd object-fetcher")
	os.system("python fetcher.py")
	print("	done!")

	print("Running recipe-converter...")
	os.system("cd {}".format(masterdir))
	os.system("cd recipe-converter")
	os.system("python recipe-converter.py")
	print("	done!")

	print("Trying to pair recipes and atoms...")
	pair_recipes(masterdir)
	print("	all done.")