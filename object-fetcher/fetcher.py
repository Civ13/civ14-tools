import os
import sys
import shutil

icon_list = ["/icons/obj/clothing/glasses.dmi","/icons/obj/clothing/belts.dmi","/icons/obj/clothing/gloves.dmi","/icons/obj/clothing/shoes.dmi","/icons/obj/clothing/hats.dmi","/icons/obj/clothing/masks.dmi","/icons/obj/clothing/suits.dmi","/icons/obj/clothing/uniforms.dmi"]
worn_list = ["/icons/mob/eyes.dmi","/icons/mob/back.dmi","/icons/mob/belt.dmi","/icons/mob/hands.dmi","/icons/mob/feet.dmi","/icons/mob/head.dmi","/icons/mob/mask.dmi","/icons/mob/suit.dmi","/icons/mob/uniform.dmi"]
path1 = ''
path2 = ''

component_list = {"gloves":"Gloves","glasses":"Glasses","belts":"Belt","shoes":"FootItem","hats":"HeadItem","masks":"MaskItem","suits":"SuitItem","uniforms":"UniformItem"}

def create_obj(objname, otype):
	component = "Structure"
	component = component_list[otype]
	CSONstring = '{}:\n'.format(objname)
	CSONstring += '	components: ["{}"]\n'.format(component)
	CSONstring += '	vars:\n'
	CSONstring += '		components:\n'
	CSONstring += '			{}:\n'.format(component)
	CSONstring += '				worn_icon: "icons/mob/worn/{}.png"\n'.format(otype)
	CSONstring += '				worn_icon_state: "{}"\n'.format(objname)
	CSONstring += '				can_adjust: false\n'
	CSONstring += '			Examine:\n'
	CSONstring += '				desc: ""\n'
	CSONstring += '		name: "{}"\n'.format(objname.replace("_"," "))
	CSONstring += '		icon: "icons/mob/under/{}.png"\n'.format(otype)
	CSONstring += '		icon_state: "{}"\n'.format(objname)
	CSONstring += '	tree_paths: ["items/clothing/{}/{}"]\n'.format(otype,objname)
	return CSONstring

def read_metadata(file2edit):
	lines = open(file2edit).readlines()
	otype = "structure" # default object type if we can't infer it from the path
	typesplit = file2edit.split("/out/")[1]
	typesplit2 = typesplit.split(".dmi.dump.txt")[0]
	otype = typesplit2
	print("type is {}".format(otype))
	fullstring = ""
	for line in lines:
		if line.find("state = ") != -1:
			parsedline = line.split('state = ')
			objname = parsedline[1].replace('"','').replace("\n","")
			if (objname != ""):
				fullstring += create_obj(objname,otype)
	atom_file = open("atoms/{}.atom".format(otype), "w")
	atom_file.write(fullstring)
	atom_file.close()

if (__name__ == "__main__"):
	masterdir = os.path.normpath(os.getcwd() + os.sep + os.pardir).replace("\\","/")
	dmi2pngdir = masterdir+"/dmi2png-ts/"
	currdir = os.getcwd()

	file = open("{}/config.txt".format(masterdir), 'r')
	lines = file.readlines()
	path1 = lines[1].replace("\\","/").replace("\n","") # civ folder
	path2 = lines[3].replace("\\","/").replace("\n","") # typespess folder
	file.close()

	if path1 == '' or path2 == '':
		print("Error! No configs found.")
		sys.exit()
	print ("Copying DMIs:")
	print("	icons...")
	for icl in icon_list:
		unipath = path1+icl
		shutil.copy(unipath, dmi2pngdir+"in/")
	print("	worn icons...")
	for wrl in worn_list:
		unipath = path1+wrl
		shutil.copy(unipath, dmi2pngdir+"in/")

	print ("Converting DMIs...")
	os.chdir(dmi2pngdir)
	os.system("python convert.py")

	new_icon_list = []
	for topng in icon_list:
		topng = topng.replace(".dmi",".dmi.dump.txt")
		topng = topng.replace("/icons/obj/clothing/","{}out/".format(dmi2pngdir))
		new_icon_list.append(topng)

	os.chdir(currdir)
	print("Objects:")
	for file2object in new_icon_list:
		unipath = file2object
		print ("	creating objects from {}...".format(unipath))
		read_metadata(unipath)
		
	print("All done. The icon files (.png and .json) are in {} and the object .atom files are in {}.".format(dmi2pngdir+"in",currdir+"/atoms"))