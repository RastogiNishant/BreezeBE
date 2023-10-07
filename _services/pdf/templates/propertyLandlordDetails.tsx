import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '2px',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  contentWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F6FCFC',
    minHeight: 15,
    width: '100%',
    height: 'auto',
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: '2px 5px 0 7px',
    borderRadius: '5px',
  },
  label: {
    color: '#000000',
    fontSize: 8,
  },
  text: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  propId: {
    fontSize: 8,
    fontWeight: 600,
    color: '#000000',
    textDecoration: 'underline',
    fontFamily: 'Montserrat',
    fontStyle: 'italic',
    marginRight: '5px',
  },
  right: {
    fontSize: 8,
    fontWeight: 600,
    color: '#000000',
    marginRight: '5px',
  },
  icon: {
    width: '6px',
    marginRight: '7px',
  },
});

const PropertyLandlordDetails = ({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  leftIconValue = null,
  rightIconValue = null,
  isLeftItalic = false,
  isRightItalic = false,
  rightWidth = false,
  leftWidth = false,
}: any) => (
  <>
    <View style={styles.headerWrapper}>
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <View style={[styles.label, { width: leftWidth || '40%' }]}>
            <Text>{leftLabel}:</Text>
          </View>
          <View
            style={[
              styles.text,
              {
                width: rightWidth || '60%',
                justifyContent: 'flex-end',
              },
            ]}
          >
            <Text style={isLeftItalic ? styles.propId : styles.right}>{leftValue}</Text>
            {leftIconValue && <Image src={leftIconValue} style={styles.icon} />}
          </View>
        </View>
        <View style={[styles.contentWrapper, { marginLeft: '10px' }]}>
          <View style={[styles.label, { width: '40%' }]}>
            <Text>{rightLabel}:</Text>
          </View>
          <View style={[styles.text, { width: '60%', justifyContent: 'flex-end' }]}>
            <Text style={isRightItalic ? styles.propId : styles.right}>{rightValue}</Text>
            {rightIconValue && <Image src={rightIconValue} style={styles.icon} />}
          </View>
        </View>
      </View>
    </View>
  </>
);

export default PropertyLandlordDetails;
